import { itemIds } from "./tree";
import { ROOT_ID, emptyPair, type SimNode, type StageMap } from "./types";


function folder(id: string, name: string, children: SimNode[]): SimNode {
  return { id, name, kind: "folder", children };
}

function item(id: string, name: string): SimNode {
  return { id, name, kind: "item" };
}

function cases(dir: string, names: string[]): SimNode[] {
  return names.map((name) => item(`${dir}__${name}`, name));
}

const ZS_CASES = [
  "1_0_CLAMP_inter_ILIMT",
  "1_1_CLAMP_inter_ILIMT_fast",
  "2_0_CLAMP_R_ILIMT",
  "2_1_CLAMP_R_ILIMT_ALL_V",
  "2_2_CLAMP_R_ILIMT_fast",
  "2_3_CLAMP_R_ILIMT_NoOUT",
  "3_0_SST_inter_ILIMT",
  "3_1_SST_inter_ILIMT_fast",
  "4_0_SST_R_ILIMT",
  "4_1_SST_R_ILIMT_fast",
  "5_BODYSW",
];

/** 虚拟根 → 一级目录 → 二级目录 → 三级 case */
export const seedRoot: SimNode = folder(ROOT_ID, "", [
  folder("sim_lists", "sim_lists", [
    folder("IQ", "IQ", cases("IQ", ["IQ1", "IQ2", "IQ3", "ISD"])),
    folder("SSEN", "SSEN", cases("SSEN", ["SS_EN", "ENVIN_5V", "ENVIN_12V", "VINEN_5V", "VINEN_12V", "EN0VIN12"])),
    folder("UP", "UP", cases("UP", ["UP_fast", "0V", "3A", "UP_short", "UP_slow"])),
    folder("VTH", "VTH", cases("VTH", ["EN", "UVLO", "OVP1", "OVP2", "OVP3"])),
    folder("VOUT_CAP", "VOUT_CAP", cases("VOUT_CAP", ["19V_1mF"])),
    folder("sim_list_ZS", "sim_list_ZS", cases("sim_list_ZS", ZS_CASES)),
  ]),
]);

export const seedStages: StageMap = Object.fromEntries(
  itemIds(seedRoot).map((id) => [id, emptyPair()]),
);
