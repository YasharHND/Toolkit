import { Link } from 'react-router-dom';

export function Home() {
  const tools = [
    {
      name: 'UUID Generator',
      description: 'Generate UUID v4 (random) or v5 (name-based) identifiers',
      path: '/uuid',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="h-full">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
              <svg className="h-12 w-12" viewBox="0 0 512 512">
                <path
                  fill="white"
                  d="M352 320c88.4 0 160-71.6 160-160c0-15.3-2.2-30.1-6.2-44.2c-3.1-10.8-16.4-13.2-24.3-5.3l-76.8 76.8c-3 3-7.1 4.7-11.3 4.7H336c-8.8 0-16-7.2-16-16V118.6c0-4.2 1.7-8.3 4.7-11.3l76.8-76.8c7.9-7.9 5.4-21.2-5.3-24.3C382.1 2.2 367.3 0 352 0C263.6 0 192 71.6 192 160c0 19.1 3.4 37.5 9.5 54.5L19.9 396.1C7.2 408.8 0 426.1 0 444.1C0 481.6 30.4 512 67.9 512c18 0 35.3-7.2 48-19.9L297.5 310.5c17 6.2 35.4 9.5 54.5 9.5zM80 456c-13.3 0-24-10.7-24-24s10.7-24 24-24s24 10.7 24 24s-10.7 24-24 24z"
                />
              </svg>
            </div>
          </div>
          <h1 className="mb-4 text-5xl font-bold text-white">Toolkit</h1>
          <p className="text-xl text-gray-400">
            A collection of developer tools to make your life easier
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="hover:bg-gray-750 group rounded-xl border border-gray-700 bg-gray-800 p-6 transition-all hover:border-orange-500"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gray-700 text-orange-500 transition-colors group-hover:bg-orange-600 group-hover:text-white">
                {tool.icon}
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">{tool.name}</h3>
              <p className="text-gray-400">{tool.description}</p>
              <div className="mt-4 flex items-center text-orange-500 transition-colors group-hover:text-orange-400">
                <span className="text-sm font-medium">Open tool</span>
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
