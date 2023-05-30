'use client';
import "@/app/core-2169/datatable.scss";
import {CORE2169FileMetaData} from "@/models";

type PropTypes = {
  fileMetaData: CORE2169FileMetaData[],
  onChangeIsUse: (fieldID: string) => void,
}
export const DataTable = (props: PropTypes) => {
  const { fileMetaData } = props


  const handleChangeIsUse = (fieldID: string) => {
    props?.onChangeIsUse && props.onChangeIsUse(fieldID)
  }

  let position = 1;

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
        <tr>
          <th>Is Use</th>
          <th>Field ID</th>
          <th>Description</th>
          <th>Length</th>
          <th>Start Position</th>
        </tr>
        </thead>
        <tbody>
        {
          fileMetaData.map(row => {
            const fieldPosition = position;
            position += row.length;
            return (
                <tr key={row.fieldID}>
                  <th><input type="checkbox" className="checkbox-primary checkbox" checked={row.isUse} onChange={() => handleChangeIsUse(row.fieldID)}/></th>
                  <th>{ row.fieldID }</th>
                  <th>{ row.description }</th>
                  <th>{ row.length }</th>
                  <th>{fieldPosition}</th>
                </tr>
            )
          })
        }
        </tbody>
      </table>
    </div>
  )
}