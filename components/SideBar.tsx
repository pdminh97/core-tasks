import Link from "next/link";

export const SideBar = () => {
  return (
    <aside className="sidebar h-full sidebar-fixed-left justify-start">
      <section className="sidebar-title items-center p-4">
        <Link href="/">
        <div className="flex flex-col">
          <span>DuMi</span>
          <span className="text-xs font-normal text-content2">API VN</span>
        </div>
        </Link>
      </section>
      <section className="sidebar-content h-fit min-h-[20rem] overflow-visible">
        <nav className="menu rounded-md">
          <section className="menu-section px-4">
            <ul className="menu-items">
                <Link href="/core-2169" className="menu-item">CORE-2169</Link>
            </ul>
          </section>
        </nav>
      </section>
    </aside>
  )
}