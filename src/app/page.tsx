import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
// Icons from react-icons
import { 
  FiArrowUpRight,
  FiShield,
  FiSmartphone,
  FiCreditCard,
  FiGift,
} from "react-icons/fi";

export default async function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose YourExchange</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The fastest, most secure way to send money to Colombia using
              blockchain technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FiSmartphone className="w-6 h-6" />,
                title: "Phone Number Lookup",
                description:
                  "Send money using just a phone number - we handle the rest",
              },
              {
                icon: <FiShield className="w-6 h-6" />,
                title: "Blockchain Security",
                description: "Powered by zkEVM for maximum security",
              },
              {
                icon: <FiCreditCard className="w-6 h-6" />,
                title: "Multiple Cash-Out Options",
                description:
                  "Bancolombia, Nequi, Daviplata - choose what works",
              },
              {
                icon: <FiGift className="w-6 h-6" />,
                title: "NFT Receipts",
                description: "Commemorative NFT for every completed transfer",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">$10M+</div>
              <div className="text-blue-100">Transferred to Colombia</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <div className="text-blue-100">Happy Recipients</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">Under 2 min</div>
              <div className="text-blue-100">Average Transfer Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Send money to Colombia in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Enter Phone Number</h3>
              <p className="text-gray-600">
                Enter your recipient's Colombian phone number. We'll create a
                wallet if they don't have one.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Send USDC/USDT</h3>
              <p className="text-gray-600">
                Choose your amount and confirm the transfer on Astar zkEVM
                blockchain.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Recipient Receives</h3>
              <p className="text-gray-600">
                They can hold stablecoins or cash out to Colombian Pesos via
                Bancolombia, Nequi, or Daviplata.
              </p>
            </div>
          </div>

          <div className="text-center">
            <a
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Start Sending Money
              <FiArrowUpRight className="w-5 h-5 ml-1" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
