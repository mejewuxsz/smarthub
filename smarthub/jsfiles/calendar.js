    document.addEventListener('DOMContentLoaded', function() {
        let calendar = document.querySelector('.calendar')
        
        const month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        
        // Store current task dates globally
        let currentTaskDates = {}
        
        isLeapYear = (year) => {
            return (year % 4 === 0 && year % 100 !== 0 && year % 400 !== 0) || (year % 100 === 0 && year % 400 ===0)
        }
        
        getFebDays = (year) => {
            return isLeapYear(year) ? 29 : 28
        }
        
        generateCalendar = (month, year, taskDates = {}) => {
            // Update global task dates
            currentTaskDates = taskDates
        
            let calendar_days = calendar.querySelector('.calendar-days')
            let calendar_header_year = calendar.querySelector('#year')
            let month_picker = calendar.querySelector('#month-picker')
        
            let days_of_month = [31, getFebDays(year), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        
            calendar_days.innerHTML = ''
        
            let currDate = new Date()
            if (month === undefined) month = currDate.getMonth()
            if (year === undefined) year = currDate.getFullYear()
        
            let curr_month = month_names[month]
            month_picker.textContent = curr_month
            calendar_header_year.textContent = year
        
            // get first day of month
            let first_day = new Date(year, month, 1)
        
            // Add blank days for days before the first day of the month
            for (let i = 0; i < first_day.getDay(); i++) {
                let blankDay = document.createElement('div')
                blankDay.className = 'calendar-day blank'
                calendar_days.appendChild(blankDay)
            }
        
            // Add days of the month
            for (let i = 1; i <= days_of_month[month]; i++) {
                let day = document.createElement('div')
                day.className = 'calendar-day'
                day.textContent = i
        
                let isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
        
                if (taskDates[isoDate]) {
                    const task = taskDates[isoDate]
                    const deadlineDate = new Date(isoDate)
                    const now = new Date()
                    const daysDiff = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24))
        
                    if (daysDiff <= 0) {
                        day.classList.add("due-today")
                    } else if (daysDiff <= 7) {
                        day.classList.add("due-week")
                    } else {
                        day.classList.add("due-later")
                    }
        
                    day.title = task.title + ": " + task.description
                }
        
                if (i === currDate.getDate() && year === currDate.getFullYear() && month === currDate.getMonth()) {
                    day.classList.add('curr-date')
                }
        
                // Add click handler for the day
                day.addEventListener('click', () => {
                    showTasksOnDate(isoDate)
                })
        
                calendar_days.appendChild(day)
            }
        }
        
        let currDate = new Date()
        
        let curr_month = {value: currDate.getMonth()}
        let curr_year = {value: currDate.getFullYear()}
        
        generateCalendar(curr_month.value, curr_year.value)
        
        document.querySelector('#prev-year').addEventListener('click', () => {
            --curr_year.value
            generateCalendar(curr_month.value, curr_year.value, currentTaskDates)
        })
        
        document.querySelector('#next-year').addEventListener('click', () => {
            ++curr_year.value
            generateCalendar(curr_month.value, curr_year.value, currentTaskDates)
        })
        
        // Add event listeners for month navigation arrows
        document.getElementById('prev-month').addEventListener('click', (e) => {
            e.stopPropagation();
            curr_month.value--;
            if (curr_month.value < 0) {
                curr_month.value = 11;
                curr_year.value--;
            }
            generateCalendar(curr_month.value, curr_year.value, currentTaskDates);
        });
        
        document.getElementById('next-month').addEventListener('click', (e) => {
            e.stopPropagation();
            curr_month.value++;
            if (curr_month.value > 11) {
                curr_month.value = 0;
                curr_year.value++;
            }
            generateCalendar(curr_month.value, curr_year.value, currentTaskDates);
        });
        
        // Update calendar with new tasks
        function updateCalendarTasks(taskDates) {
            generateCalendar(curr_month.value, curr_year.value, taskDates)
        }
        
        // Make updateCalendarTasks available globally
        window.updateCalendarTasks = updateCalendarTasks
        });
        