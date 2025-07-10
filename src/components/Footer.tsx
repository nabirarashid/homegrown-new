const Footer = () => {
  return (
    <footer className="bg-stone-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-600 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <h3 className="text-xl font-bold">HomeGrown</h3>
              </div>
              <p className="text-stone-400">
                Connecting communities with sustainable businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Discover</h4>
              <ul className="space-y-2 text-stone-400">
                <li><a href="#" className="hover:text-white transition-colors">Green Certified</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Locally Sourced</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Zero-Waste</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-stone-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>            
          <div className="border-t border-stone-700 mt-8 pt-8 text-center text-stone-400">
            <p>&copy; 2025 HomeGrown.</p>
            </div>
          </div>
        </div>
      </footer>
  )
}

export default Footer