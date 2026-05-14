package com.minecraftwarriders.storebridge;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import org.bukkit.Bukkit;
import org.bukkit.command.ConsoleCommandSender;
import org.bukkit.plugin.java.JavaPlugin;

public final class WarRidersStoreBridgePlugin extends JavaPlugin {
  private final Gson gson = new Gson();
  private HttpClient httpClient;
  private String apiBaseUrl;
  private String bridgeToken;
  private String serverId;

  @Override
  public void onEnable() {
    saveDefaultConfig();

    this.apiBaseUrl = trimTrailingSlash(getConfig().getString("api-base-url", ""));
    this.bridgeToken = getConfig().getString("bridge-token", "");
    this.serverId = getConfig().getString("server-id", "survival");
    int intervalSeconds = Math.max(5, getConfig().getInt("poll-interval-seconds", 20));

    if (apiBaseUrl.isBlank() || bridgeToken.isBlank() || bridgeToken.startsWith("replace-")) {
      getLogger().severe("Store bridge is not configured. Set api-base-url and bridge-token in config.yml.");
      Bukkit.getPluginManager().disablePlugin(this);
      return;
    }

    this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    long ticks = intervalSeconds * 20L;
    Bukkit.getScheduler().runTaskTimerAsynchronously(this, this::pollDeliveries, 40L, ticks);
    getLogger().info("Store bridge enabled for delivery target '" + serverId + "'.");
  }

  private void pollDeliveries() {
    try {
      String encodedServer = URLEncoder.encode(serverId, StandardCharsets.UTF_8);
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(URI.create(apiBaseUrl + "/api/deliveries/pending?server=" + encodedServer))
              .timeout(Duration.ofSeconds(15))
              .header("Authorization", "Bearer " + bridgeToken)
              .GET()
              .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() != 200) {
        getLogger().warning("Store API returned " + response.statusCode() + " while polling deliveries.");
        return;
      }

      JsonObject root = JsonParser.parseString(response.body()).getAsJsonObject();
      JsonArray deliveries = root.getAsJsonArray("deliveries");
      if (deliveries == null || deliveries.isEmpty()) return;

      for (int i = 0; i < deliveries.size(); i++) {
        JsonObject delivery = deliveries.get(i).getAsJsonObject();
        Bukkit.getScheduler().runTask(this, () -> applyDelivery(delivery));
      }
    } catch (InterruptedException err) {
      Thread.currentThread().interrupt();
    } catch (Exception err) {
      getLogger().log(Level.WARNING, "Could not poll store deliveries.", err);
    }
  }

  private void applyDelivery(JsonObject delivery) {
    String deliveryId = stringField(delivery, "id");
    String playerName = stringField(delivery, "minecraftName");
    String productId = stringField(delivery, "productId");
    JsonArray commandsJson = delivery.getAsJsonArray("commands");

    if (deliveryId.isBlank() || !validMinecraftName(playerName) || commandsJson == null || commandsJson.isEmpty()) {
      completeDeliveryAsync(deliveryId, false, "Delivery payload was invalid.");
      return;
    }

    ConsoleCommandSender console = Bukkit.getConsoleSender();
    List<String> executed = new ArrayList<>();
    boolean success = true;

    for (int i = 0; i < commandsJson.size(); i++) {
      String command = commandsJson.get(i).getAsString().replace("{player}", playerName).trim();
      if (command.startsWith("/")) command = command.substring(1);
      if (command.isBlank()) continue;

      boolean commandAccepted = Bukkit.dispatchCommand(console, command);
      executed.add(command);
      if (!commandAccepted) success = false;
    }

    String message =
        success
            ? "Delivered " + productId + " to " + playerName + " with " + executed.size() + " command(s)."
            : "One or more commands failed for " + productId + " / " + playerName + ": " + executed;

    getLogger().info(message);
    completeDeliveryAsync(deliveryId, success, message);
  }

  private void completeDeliveryAsync(String deliveryId, boolean success, String message) {
    if (deliveryId == null || deliveryId.isBlank()) return;

    Bukkit.getScheduler()
        .runTaskAsynchronously(
            this,
            () -> {
              try {
                String body = gson.toJson(Map.of("success", success, "message", message));
                HttpRequest request =
                    HttpRequest.newBuilder()
                        .uri(URI.create(apiBaseUrl + "/api/deliveries/" + deliveryId + "/complete"))
                        .timeout(Duration.ofSeconds(15))
                        .header("Authorization", "Bearer " + bridgeToken)
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(body))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() < 200 || response.statusCode() >= 300) {
                  getLogger().warning("Store API returned " + response.statusCode() + " while completing delivery.");
                }
              } catch (InterruptedException err) {
                Thread.currentThread().interrupt();
              } catch (IOException err) {
                getLogger().log(Level.WARNING, "Could not complete store delivery " + deliveryId + ".", err);
              }
            });
  }

  private static String stringField(JsonObject object, String field) {
    if (object == null || !object.has(field) || object.get(field).isJsonNull()) return "";
    return object.get(field).getAsString();
  }

  private static boolean validMinecraftName(String name) {
    return name != null && name.matches("[A-Za-z0-9_]{3,16}");
  }

  private static String trimTrailingSlash(String value) {
    if (value == null) return "";
    return value.replaceAll("/+$", "");
  }
}
