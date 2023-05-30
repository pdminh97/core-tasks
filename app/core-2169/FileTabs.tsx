'use client';

import {useState} from "react";


type PropTypes = {
  tabs: string[],
  onChange?: (tabID: string) => void,
}
export const FileTabs = (props: PropTypes) => {
  const { tabs } = props
  const [currentTab, setCurrentTab] = useState(tabs[0])
  const handleChangeTab = (tabID: string) => {
    setCurrentTab(tabID)
    props?.onChange && props.onChange(tabID)
  }
  return (
    <div className="tabs gap-4">
      {tabs.map(tab => (
        <div key={tab} className={`tab tab-pill ${currentTab === tab ? 'tab-active' : ''}`}
             onClick={() => handleChangeTab(tab)}>
          {tab}
        </div>
      ))}
    </div>
  )
}