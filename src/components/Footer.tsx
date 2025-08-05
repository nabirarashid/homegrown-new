const Footer = () => {
  return (
    <footer className="bg-stone-800 text-white py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg flex items-center justify-center text-white">
              🏠
            </div>
            <h3 className="text-xl font-bold">HomeGrown</h3>
          </div>
          <p className="text-stone-400 max-w-md">
            Connecting communities with sustainable businesses.
          </p>
          <div className="border-t border-stone-700 pt-4 w-full">
            <p className="text-stone-400">&copy; 2025 HomeGrown.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
