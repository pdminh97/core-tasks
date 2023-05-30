import {CORE2169FileMetaData} from "@/models";

type PropTypes = {
  rows: CORE2169FileMetaData[][],
}
export const RowDataTable = (props: PropTypes) => {
  const { rows } = props;

  return (
    <div className="table-wrapper">
      {rows.length > 0 &&
      <table className="table block overflow-auto">
        <thead>
        <tr>
          {rows[0].map(header =>
            {
              return (
                header.isUse && <th key={header.fieldID}>{header.fieldID}</th>
              )
            }
          )}
        </tr>
        </thead>
        <tbody>
        {
          rows.map((row, index) => (
            <tr key={index}>
              {row.map(col =>
                {
                  return (
                    col.isUse && <th key={col.fieldID}>{col.value}</th>
                  )
                }
              )}
            </tr>
          ))
        }
        </tbody>
      </table>
      }
    </div>
  )
}