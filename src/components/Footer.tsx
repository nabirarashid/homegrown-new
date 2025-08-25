const Footer = () => {
  return (
    <footer className="bg-stone-800 text-white py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-600 rounded-full flex items-center justify-center text-white text-xl shadow">
              🏠
            </div>
            <h3 className="text-xl font-bold">HomeGrown</h3>
          </div>
          <p className="text-stone-400 max-w-md">
            Connecting communities with sustainable businesses.
          </p>
          {/* Contact Section */}
          <div className="mt-2 flex flex-col items-center">
            <a
              href="mailto:nabira.per1701@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow text-sm font-semibold"
              style={{ textDecoration: "none" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact
            </a>
          </div>
          <div className="border-t border-stone-700 pt-4 w-full">
            <p className="text-stone-400">&copy; 2025 HomeGrown.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
