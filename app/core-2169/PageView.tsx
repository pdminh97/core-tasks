'use client';
import "@/app/core-2169/datatable.scss";
import {FileTabs} from "@/app/core-2169/FileTabs";
import {DataTable} from "@/app/core-2169/DataTable";
import {CORE2169FileData, CORE2169FileMetaData} from "@/models";
import {useEffect, useState} from "react";
import {RowDataTable} from "@/app/core-2169/RowDataTable";

type PropTypes = {
  filesMetaData: { [key: string]: CORE2169FileMetaData[] },
  data: CORE2169FileData,
}

const TAB_PEFCHI_40 = 'PEFCHI_40', TAB_PEFCHI_R0 = 'PEFCHI_R0', TAB_PEFCHI_13 = 'PEFCHI_13', TAB_PEFCHI_94 = 'PEFCHI_94'
const tabs = [TAB_PEFCHI_40, TAB_PEFCHI_13, TAB_PEFCHI_R0, TAB_PEFCHI_94]
export const PageView = (props: PropTypes) => {

  const { filesMetaData, data } = props

  const [fileMetaData, setFileMetaData] = useState(filesMetaData[TAB_PEFCHI_40])
  const [dataRows, setDataRows] = useState<CORE2169FileMetaData[][]>([])


  const handleChangeTab = (tabID: string) => {
    console.log(tabID);
    const tabIDCast = tabID as (keyof CORE2169FileData)
    setFileMetaData(filesMetaData[tabID])
    setDataRows(data[tabIDCast])
  }

  const handleChangeIsUse = (fieldID: string) => {
    const newRows = [...dataRows];
    newRows.forEach(row => {
      const column = row.find(col => col.fieldID === fieldID)
      if(column) {
        column.isUse = !column.isUse
      }
    })
    setDataRows(newRows)

    const newFileMetaData = [...fileMetaData]
    const column = newFileMetaData.find(col => col.fieldID === fieldID)
    if(column) {
      column.isUse = !column.isUse
    }
    setFileMetaData(newFileMetaData)
  }

  useEffect(() => {
    setFileMetaData(filesMetaData[TAB_PEFCHI_40])
    const data1 = data[TAB_PEFCHI_40]
    setDataRows(data1)
  }, [])

  return (
   <div className="content">
     <FileTabs onChange={handleChangeTab} tabs={tabs}/>
     <div className="tables">
       <RowDataTable rows={dataRows} />
       <DataTable fileMetaData={fileMetaData} onChangeIsUse={handleChangeIsUse}/>
     </div>
   </div>
  )
}