import { useRef } from 'react'

function ActivityItem ({assignmentName, subject, description, date}) {
    return (
        <div className="">
            <div className="min-w-[300px] flex-shrink-0 bg-[#dee6f7] rounded-3xl p-5">
                <h3 className="text-xl font-medium text-gray-950 mb-1">{assignmentName}</h3>
                <p className="text-gray-700 mb-5">{subject}</p>
                <p className="text-gray-800 text-wrap mb-5">{description}</p>
                <p className="text-gray-700 text-[15px] text-end">{date}</p>
                <button className="bg-biru-dasar text-white w-full rounded-2xl mt-5 hover:bg-blue-800 cursor-pointer">Cek</button>
            </div>
        </div>
    )
}

export default function CardAktifitas ({title = "Aktifitas Terakhir", activity = []}) {

    const scrollContainerRef = useRef(null)

    // Untuk ngehandle scroll ke kanan
    const handleMouseDown = (e) => {
        const slider = scrollContainerRef.current
        if (!slider) return

        let isDown = true
        const startX = e.pageX - slider.offsetLeft
        const scrollLeft = slider.scrollLeft

        const handleMouseMove =(e) => {
            if (!isDown) return
            e.preventDefault()
            const x = e.pageX - slider.offsetLeft
            const walk = (x - startX) * 2 // Kecepatan Scroll
            slider.scrollLeft = scrollLeft - walk
        }

        const handleMouseUp = () => {
            isDown = false
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
        }

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
    }

    return (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-5">
            <h2 className="text-start font-bold text-3xl mb-6">{title}</h2>

            {activity.length === 0 ? (
                <div className="flex justify-center items-center h-32 bg-[#D9D9D9] rounded-2xl">
                    <p className="text-gray-500 text-lg">Belum ada aktifitas</p>
                </div>
            ) : (
                <div ref={scrollContainerRef} className='flex gap-4 overflow-x-auto pb-4 no-scrollbar cursor-grab active:cursor-grabbing' 
                    onMouseDown={handleMouseDown} 
                    style={{ 
                        scrollbarWidth: 'none', 
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch', 
                    }}
                >
                    {activity.map((activity, index) => (
                        <ActivityItem
                            key={index}
                            assignmentName={activity.assignmentName}
                            subject={activity.subject}
                            description={activity.description}
                            date={activity.date}
                        />
                    ))} 
                </div>
                
            )}

            
        </div>
    )
}