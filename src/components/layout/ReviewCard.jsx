export default function ReviewCard({ title, description, color }) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
        <div className="flex ">
            <div className={`w-8 h-8 mr-4 mb-4 rounded-full text-white text-3xl ${color}`}></div>
            <h3 className="text-lg font-bold mb-2">{title}</h3>
        </div>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    );
}
