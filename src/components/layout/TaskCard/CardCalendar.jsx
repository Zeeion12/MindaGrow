import { useState, useEffect } from "react";


export default function CardCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Untuk update waktu tiap menit berdasarkan waktu dunia nyata
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date())
        }, 60000)

        return () => clearInterval(timer);
    }, [])

    // Mengambil data hari, bulan, dan tahun
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear();

    // Nama bulan dalam setahun
    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ]

    // Nama hari
    const dayNames = [
        "Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"
    ]

    // Function untuk mendapatkan hari diawal bulan (0 = minggu, 1 = senin, dst)
    const getFirstDayOfMonth = (year, month) => {
        const firstDay = new Date(year, month, 1).getDay()
        //Mengubah 0 (Minggu) menjadi 6 (Sabtu)
        return firstDay === 0 ? 6 : firstDay - 1; // 
    }

    // Function untuk mendapatkan jumlah hari dalam sebulan
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate()
    }

    // Function untuk mendapatkan jumlah minggu
    const getWeekNumber = (date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
        const pastDayOfYear = (date - firstDayOfYear) / 86400000
        return Math.ceil((pastDayOfYear + firstDayOfYear.getDay() + 1) / 7)
    }

    // Generate data kalender
    const generateCalendarData = () => {
        const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)
        const daysInMonth = getDaysInMonth(currentYear, currentMonth)
        const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1)

        const calendarDays = []
        let weekNumber = getWeekNumber(new Date (currentYear, currentMonth, 1))
        let week = []

        // Menambahkan hari dari bulan sebelumnya
        for (let i = 0; i < firstDayOfMonth; i++) {
            week.push({
                day: daysInPrevMonth - firstDayOfMonth + i + 1,
                currentMonth: false,
                isToday: false,
                isWeekend: i >= 5,
            })
        }

        // Menambahkan hari dari bulan sekarang
        for (let i = 1; i <= daysInMonth; i++) {
            const dayOfWeek = (firstDayOfMonth + i - 1) % 7
            const isWeekend = dayOfWeek >= 5

            if (week.length === 7) {
                calendarDays.push({ weekNumber, days: week })
                weekNumber++
                week = []
            }

            week.push({
                day: i,
                currentMonth: true,
                isToday: i === currentDay && currentDate.getMonth() === currentMonth && currentDate.getFullYear() === currentYear,
                isWeekend,
            })
        }

        // Menambahkan hari dari bulan berikutnya
        let nextMonthDay = 1
        while (week.length < 7) {
            week.push({
                day: nextMonthDay++,
                currentMonth: false,            isToday: false,
                isWeekend: week.length >= 5,
            })
        }

        // Tambahkan minggu terakhir ke kalender
        calendarDays.push({ weekNumber, days: week })

        // Tambahkan 1 minggu jika minggunya kurang dari 6 minggu
        if (calendarDays.length < 6) {
            week = []
            weekNumber++

            for (let i = 0; i < 7; i++) {
                week.push({
                    day: nextMonthDay++,
                    currentMonth: false,
                    isToday: false,
                    isWeekend: i >= 5,
                })
            }
            calendarDays.push({ weekNumber, days: week })
        }

        return calendarDays
    }

    const calendarData = generateCalendarData()

    return(
        <div className="max-w-md  bg-white rounded-3xl shadow-lg overflow-hidden">
            {/* Header bulan ama tahun */}
            <div className="flex justify-center p-4">
                <div className="bg-biru-dasar text-white text-2xl font-semibold px-8 py-2 rounded-lg">
                    {monthNames[currentMonth]}, {currentYear}
                </div>
            </div>

            {/* Grid Kalender */}
            <div className="p-4">
                {/* Header hari dalam seminggu */}
                <div className="grid grid-cols-8 bg-gray-200 rounded-lg mb-2">
                    <div className="p-2 text-center font-medium">
                        {currentMonth < 9 ? "0" : ""}
                        {currentMonth + 1}
                    </div>
                    {dayNames.map((day, index) => (
                        <div key={index} className={`p-2 text-center font-medium ${index >= 5 ? "text-blue-500" : ""}`}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Row Kalender */}
                {calendarData.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-8 mb-2">
                        {/* Angka Minggu */}
                        <div className="bg-blue-400 text-white flex items-center justify-center rounded-lg">{week.weekNumber}</div>

                        {/* Hari */}
                        {week.days.map((day, dayIndex) => (
                            <div key={dayIndex} className={`p-2 text-center ${
                                day.isToday
                                ? "bg-biru-dasar text-white rounded-lg" 
                                : day.isWeekend && day.currentMonth
                                ? "text-biru-dasar"
                                : !day.currentMonth
                                ? "text-gray-400"
                                : ""}`}>
                                    {day.day}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

        </div>
    );
}
