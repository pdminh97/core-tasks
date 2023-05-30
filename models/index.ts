export type CORE2169FileData = {
  PEFCHI_40: CORE2169FileMetaData[][],
  PEFCHI_94: CORE2169FileMetaData[][],
  PEFCHI_13: CORE2169FileMetaData[][],
  PEFCHI_R0: CORE2169FileMetaData[][],
}

export type CORE2169FileMetaData = {
  fieldID: string,
  description: string,
  length: number,
  isUse: boolean,
  value?: string,
  isUTF_16?: boolean,
}