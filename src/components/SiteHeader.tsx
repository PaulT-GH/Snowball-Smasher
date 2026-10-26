import { useState } from 'react';

const navLinks = [
  { label: 'Calculator', href: '/', active: true },
  { label: 'How It Works', href: '/pages/how-it-works.html', active: false },
  { label: 'Resources', href: '/pages/resources.html', active: false },
  { label: 'Blog', href: '/pages/blog.html', active: false },
  { label: 'About', href: '/pages/about.html', active: false }
];

const SiteHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/">
          <img src="/images/logo.png" alt="Snowball Smasher" className="h-10" />
        </a>

        <button
          className="md:hidden p-2"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        >
          <span className="block w-6 h-[3px] bg-[#2c3e50] my-[5px]"></span>
          <span className="block w-6 h-[3px] bg-[#2c3e50] my-[5px]"></span>
          <span className="block w-6 h-[3px] bg-[#2c3e50] my-[5px]"></span>
        </button>

        <nav className={`${menuOpen ? 'block' : 'hidden'} absolute left-0 right-0 top-full bg-white shadow-sm md:static md:block md:shadow-none`}>
          <ul className="flex flex-col md:flex-row gap-2 md:gap-8 px-4 py-3 md:p-0 m-0 list-none">
            {navLinks.map(link => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className={`font-semibold text-[#2c3e50] pb-1 border-b-2 hover:border-[#27ae60] ${link.active ? 'border-[#27ae60]' : 'border-transparent'}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default SiteHeader;
