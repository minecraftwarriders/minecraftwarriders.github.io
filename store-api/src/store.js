import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const defaultState = {
  orders: [],
  deliveries: []
};

export class FileStore {
  constructor(filePath) {
    this.filePath = resolve(filePath);
    this.writeChain = Promise.resolve();
  }

  async read() {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      return {
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        deliveries: Array.isArray(parsed.deliveries) ? parsed.deliveries : []
      };
    } catch (err) {
      if (err.code === "ENOENT") return structuredClone(defaultState);
      throw err;
    }
  }

  async write(state) {
    await mkdir(dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.tmp`;
    await writeFile(tmp, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    await rename(tmp, this.filePath);
  }

  async update(mutator) {
    this.writeChain = this.writeChain.then(async () => {
      const state = await this.read();
      const result = await mutator(state);
      await this.write(state);
      return result;
    });
    return this.writeChain;
  }
}
