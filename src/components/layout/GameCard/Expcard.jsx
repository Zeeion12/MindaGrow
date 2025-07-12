// src/components/layout/GameCard/Expcard.jsx
const Expcard = ({ progress, level, totalXp }) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* Tampilkan data dinamis */}
            <div className="text-lg font-bold">Level {level}</div>
            <div className="text-sm text-gray-600">{totalXp} XP Total</div>
            {/* Progress bar dengan nilai dinamis */}
        </div>
    );
};

export default Expcard;