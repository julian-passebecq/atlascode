import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const limitBytes=500*1024;
const assetsDir=new URL("../dist/assets/",import.meta.url);

const files=(await readdir(assetsDir)).filter(file=>file.endsWith(".js"));
const sizes=await Promise.all(files.map(async file=>({
  file,
  bytes:(await stat(join(assetsDir.pathname,file))).size
})));

sizes.sort((a,b)=>b.bytes-a.bytes);

for(const item of sizes){
  console.log(`${item.file}: ${(item.bytes/1024).toFixed(1)} kB`);
}

const oversized=sizes.filter(item=>item.bytes>limitBytes);
if(oversized.length){
  console.error(`Bundle budget exceeded: ${oversized.map(item=>item.file).join(", ")}`);
  process.exit(1);
}

console.log(`Bundle budget PASS: ${sizes.length} JS chunks, each <= 500 kB`);
