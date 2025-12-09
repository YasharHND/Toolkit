import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();
  const tools = [
    {
      path: '/uuid',
      label: 'UUID Generator',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
          />
        </svg>
      ),
    },
    {
      path: '/unescape',
      label: 'Unescape Text',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <text
            x="12"
            y="17"
            textAnchor="middle"
            fontSize="18"
            fontWeight="bold"
            fontFamily="monospace"
            fill="currentColor"
          >
            \
          </text>
        </svg>
      ),
    },
    {
      path: '/json',
      label: 'JSON Formatter',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <text
            x="12"
            y="17"
            textAnchor="middle"
            fontSize="16"
            fontWeight="bold"
            fontFamily="monospace"
            fill="currentColor"
          >
            {'{}'}
          </text>
        </svg>
      ),
    },
  ];

  const currentTool = tools.find((tool) => tool.path === location.pathname);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-700 bg-zinc-900 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex w-52 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
              <svg className="h-6 w-6" viewBox="0 0 512 512">
                <path
                  fill="white"
                  d="M352 320c88.4 0 160-71.6 160-160c0-15.3-2.2-30.1-6.2-44.2c-3.1-10.8-16.4-13.2-24.3-5.3l-76.8 76.8c-3 3-7.1 4.7-11.3 4.7H336c-8.8 0-16-7.2-16-16V118.6c0-4.2 1.7-8.3 4.7-11.3l76.8-76.8c7.9-7.9 5.4-21.2-5.3-24.3C382.1 2.2 367.3 0 352 0C263.6 0 192 71.6 192 160c0 19.1 3.4 37.5 9.5 54.5L19.9 396.1C7.2 408.8 0 426.1 0 444.1C0 481.6 30.4 512 67.9 512c18 0 35.3-7.2 48-19.9L297.5 310.5c17 6.2 35.4 9.5 54.5 9.5zM80 456c-13.3 0-24-10.7-24-24s10.7-24 24-24s24 10.7 24 24s-10.7 24-24 24z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Toolkit</h1>
          </Link>

          <a
            href="https://yashar.one"
            className="text-lg font-semibold text-zinc-300 transition-colors hover:text-orange-400"
          >
            YasharHND
          </a>

          {/* Tools Dropdown */}
          <nav className="relative flex w-52 justify-end">
            <div className="group">
              <button
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 font-medium transition-colors ${
                  currentTool
                    ? 'bg-orange-600 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {currentTool ? (
                  <>
                    {currentTool.icon}
                    {currentTool.label}
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                    Tools
                  </>
                )}
                <svg
                  className="h-4 w-4 transition-transform group-hover:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              <div className="invisible absolute right-0 top-full pt-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                <div className="min-w-48 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl">
                  {tools.map((tool) => (
                    <Link
                      key={tool.path}
                      to={tool.path}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        location.pathname === tool.path
                          ? 'bg-orange-600 text-white'
                          : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
                      }`}
                    >
                      {tool.icon}
                      {tool.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
