export default function FeaturedCard({ icon: Icon, title, description, color }) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300">
        <div className={`flex justify-center items-center w-16 h-16 mx-auto mb-4 rounded-full text-white text-3xl ${color}`}>
          <Icon />
        </div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    );
}
