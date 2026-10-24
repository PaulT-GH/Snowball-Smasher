const SiteFooter = () => (
  <footer className="bg-[#343a40] text-white pt-10 pb-6">
    <div className="max-w-[1200px] mx-auto px-4">
      <div className="flex flex-wrap justify-between gap-8 mb-8">
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-lg font-semibold text-white mb-3">Snowball Smasher</h3>
          <p className="text-[#ced4da]">Your path to debt freedom starts here.</p>
        </div>
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-lg font-semibold text-white mb-3">Quick Links</h3>
          <ul className="list-none p-0 m-0">
            <li className="mb-1"><a href="/" className="text-[#ced4da] hover:text-white">Calculator</a></li>
            <li className="mb-1"><a href="/pages/how-it-works.html" className="text-[#ced4da] hover:text-white">How It Works</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center pt-6 border-t border-white/10">
        <p>&copy; {new Date().getFullYear()} Snowball Smasher. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
