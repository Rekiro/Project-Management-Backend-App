import fs from "node:fs/promises";

const cleanupFiles = (files = []) => {
    return Promise.allSettled(files.map((f) => fs.unlink(f.path)));
};

export default cleanupFiles;
