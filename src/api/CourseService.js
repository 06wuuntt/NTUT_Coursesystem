const BASE_URL = "https://gnehs.github.io/ntut-course-crawler-node/";

/**
 * Standardize course object structure to ensure consistency across the app.
 * This should be the single source of truth for course data shape.
 */
export const standardizeCourse = (rawCourse) => {
    if (!rawCourse) return null;
    const c = { ...rawCourse }; // Keep all original properties

    // 1. ID: Ensure it's a string
    c.id = String(c.id ?? c.courseId ?? c.code ?? '');

    // 2. Name: Ensure it's a string (zh > en)
    if (c.name && typeof c.name === 'object') {
        c.name = c.name.zh || c.name.en || '';
    }

    // 3. Credits: Ensure it's a number
    c.credit = Number(c.credit ?? c.credits ?? c.creditsTotal ?? 0);
    c.credits = c.credit; // Alias

    // 4. Type: Map symbols to readable text if needed, but keep original symbols too
    const typeMap = { '○': '共同必修', '△': '共同必修', '☆': '共同選修', '●': '專業必修', '▲': '專業必修', '★': '專業選修' };
    const typeSymbol = c.courseType || c.type || '';
    c.type = typeMap[typeSymbol] || typeSymbol || '選修'; // Default to string if known, else '選修' or original
    c.courseType = typeSymbol; // Keep original symbol

    // 5. Teacher: Normalize to string
    if (Array.isArray(c.teacher)) {
        c.teacher = c.teacher.map(t => (typeof t === 'object' ? t.name : t)).join('、');
    } else if (typeof c.teacher === 'object' && c.teacher) {
        c.teacher = c.teacher.name || '';
    }

    // 6. Time: Normalize to [{day: 1, period: '1'}, ...]
    if (c.time && typeof c.time === 'object' && !Array.isArray(c.time)) {
        const times = [];
        const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };
        for (const [k, v] of Object.entries(c.time)) {
            const dayIdx = dayMap[k.toLowerCase()] || Number(k);
            const periods = Array.isArray(v) ? v : [v];
            periods.forEach(p => {
                if (dayIdx && p) times.push({ day: dayIdx, period: String(p) });
            });
        }
        c.time = times;
    } else if (!Array.isArray(c.time)) {
        c.time = [];
    }

    // 7. Location/Classroom: Normalize to string
    if (!c.location) {
        if (Array.isArray(c.classroom)) {
            c.location = c.classroom.map(r => r.name || r).join('、');
        } else {
            c.location = c.classroom?.name || String(c.classroom || '無教室資訊');
        }
    }
    // Default to '無教室資訊' if empty, to ensure it displays on TimeTable
    if (!c.location || c.location === 'undefined') {
        c.location = '無教室資訊';
    }
    return c;
};

const convertSemesterId = (semesterId) => {
    const [year, sem] = semesterId.split('-');
    return { year, sem };
};

// --- 1. 學期 API ---
export async function fetchSemesters() {
    const response = await fetch(`${BASE_URL}main.json`);
    if (!response.ok) {
        throw new Error(`無法載入學期資料 (HTTP 狀態碼: ${response.status})`);
    }

    const apiData = await response.json();
    const semesterOptions = [];

    const years = Object.keys(apiData).sort((a, b) => Number(b) - Number(a));

    years.forEach(year => {
        const semesters = apiData[year].sort((a, b) => b - a);

        semesters.forEach(semester => {
            const label = `${year} ${semester === 1 ? '上' : '下'}學期`;
            const value = `${year}-${semester}`;
            semesterOptions.push({ value, label });
        });
    });
    return semesterOptions;
}

export async function fetchTeacherWithdrawalRates() {
    const response = await fetch(`${BASE_URL}analytics/withdrawal-recent-3-years.json`);
    if (!response.ok) {
        throw new Error(`無法載入教師退選率資料`);
    }
    const json = await response.json();
    return json.data;
}

export async function fetchCourseSyllabus(courseId, semesterId) {
    const { year, sem } = convertSemesterId(semesterId);
    const url = `${BASE_URL}${year}/${sem}/course/${courseId}.json`;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        console.error('Failed to fetch syllabus:', e);
        return null;
    }
}

// --- 2. 課程標準相關 API ---
/**
 * 實際獲取課程標準總表，並提取所有學院/系所名稱作為篩選選項
 */
export async function fetchStandardsDepartments(year) {
    // 這裡我們假設只需要傳入 year 就能取得該年度的所有系所標準
    const response = await fetch(`${BASE_URL}${year}/standard.json`);
    if (!response.ok) {
        throw new Error(`無法載入 ${year} 學年度的課程標準總表`);
    }

    const apiData = await response.json(); // API 返回 { "學程": { ... }, "四技": { ... } }

    // 扁平化所有系所選項
    const departments = [];

    // 遍歷所有學制 (例如: "學程", "五專", "四技")
    for (const academicSystem in apiData) {
        const systemData = apiData[academicSystem];
        for (const departmentName in systemData) {
            // 構建一個包含學制和系所名稱的唯一 ID，例如: "四技-電機系"
            const uniqueId = `${academicSystem}-${departmentName}`;

            departments.push({
                value: uniqueId,
                label: `${departmentName} (${academicSystem})`, // 顯示名稱
            });
        }
    }

    return {
        departmentOptions: departments,
        fullData: apiData
    };
}

/**
 * 從先前獲取到的完整數據中，根據選擇的年分和系所 ID 提取詳細標準
 * @param {string} selectedYear - 選定的年分 (例如: '114')
 * @param {string} departmentUniqueId - 選定的系所 ID (例如: '四技-電機系')
 * @param {object} fullData - fetchStandardsDepartments 返回的原始數據
 */
export async function fetchCourseStandards(selectedYear, departmentUniqueId, fullData) {
    if (!fullData) {
        throw new Error("找不到課程標準總數據");
    }

    const [academicSystem, departmentName] = departmentUniqueId.split('-');

    const deptData = fullData[academicSystem]?.[departmentName];

    if (deptData) {
        // 數據結構符合：{ credits: {...}, courses: [...], rules: [...] }
        const credits = deptData.credits;

        // 計算各類學分
        const generalRequired = parseFloat(credits["校訂共同必修學分"] || 0) + parseFloat(credits["部訂共同必修學分"] || 0);
        const professionalRequired = parseFloat(credits["校訂專業必修學分"] || 0) + parseFloat(credits["部訂專業必修學分"] || 0);
        const professionalElective = parseFloat(credits["專業選修學分"] || 0);
        const graduationTotal = parseFloat(credits["最低畢業學分數"] || 0);

        // 計算跨域及自由選修 (總學分 - 其他三項)
        // 注意：有時候 API 資料中的總學分可能不等於各項之和，這裡以剩餘學分作為自由選修
        let freeElective = graduationTotal - generalRequired - professionalRequired - professionalElective;
        if (freeElective < 0) freeElective = 0; // 避免負數

        const result = {
            generalRequired,
            professionalRequired,
            professionalElective,
            freeElective,
            graduationTotal,
            courses: deptData.courses,
            rules: deptData.rules
        };
        return result;
    } else {
        throw new Error("查無此系所的課程標準詳細資料");
    }
}

// --- 3. 行事曆 API ---
export async function fetchCalendarEvents() {
    // API URL
    const CALENDAR_URL = `${BASE_URL}calendar.json`;

    const response = await fetch(CALENDAR_URL);
    if (!response.ok) {
        throw new Error(`無法載入行事曆資料 (HTTP 狀態碼: ${response.status})`);
    }

    const apiEvents = await response.json();

    // 轉換資料格式，只保留我們需要的欄位
    const events = apiEvents
        .filter(event => event.type === 'VEVENT' && event.start) // 確保是事件且有開始日期
        .map(event => {
            // API 的日期是 ISO 格式 (e.g., "2019-05-27T00:00:00.000Z")
            // 如果事件不是從 00:00:00 開始，則視為隔天開始
            const startDateTime = new Date(event.start);
            const startTime = event.start.split('T')[1]; // 取得時間部分

            // 如果時間不是 00:00:00.000Z，則將日期加一天
            if (startTime && !startTime.startsWith('00:00:00')) {
                startDateTime.setDate(startDateTime.getDate() + 1);
            }

            const startDate = startDateTime.toISOString().split('T')[0];

            // 結束日期也進行同樣處理
            let endDate = startDate;
            if (event.end) {
                const endDateTime = new Date(event.end);
                const endTime = event.end.split('T')[1];

                if (endTime && !endTime.startsWith('00:00:00')) {
                    endDateTime.setDate(endDateTime.getDate() + 1);
                }

                endDate = endDateTime.toISOString().split('T')[0];
            }

            return {
                date: startDate,
                endDate: endDate, // 處理跨多天事件
                description: event.summary,
                location: event.location || null,
                details: event.description || null,
            };
        });

    return events;
}

// --- 4. 系所 API ---
/**
 * 根據學期獲取所有系所和班級清單
 * @param {string} semesterId - 學期 ID (例如: '114-1')
 */
export async function fetchDepartmentClasses(semesterId) {
    const { year, sem } = convertSemesterId(semesterId);

    const DEPARTMENT_URL = `${BASE_URL}${year}/${sem}/department.json`;

    const response = await fetch(DEPARTMENT_URL);
    if (!response.ok) {
        throw new Error(`無法載入 ${year}-${sem} 學期的系所資料`);
    }
    const apiData = await response.json();

    // 將 API 數據結構轉換為包含 category 的格式
    const departments = apiData.map(dept => {
        const classes = dept.class || [];

        return {
            category: dept.category || '未分類', // 使用 API 提供的 category (學院)
            name: dept.name,
            // 班級的唯一 ID 儘量保留 API 原有的 numeric id（若有），否則退回到 dept-name
            classes: classes.map(cls => ({
                // 如果 API 提供了數字 id（例如 '2788'），就直接使用它；否則使用 dept-name 與 class.name 組合
                id: String(cls.id ?? `${dept.name}-${cls.name}`),
                label: cls.name,
                deptName: dept.name,
                classCode: String(cls.code ?? ''),
            }))
        };
    }).filter(dept => dept.classes.length > 0);

    return departments; // 返回包含 category 和 name 的系所清單
}

// --- 5. 班級課表數據 API ---

// 該 API 數據量大，我們假設該 API 獲取的是單一學制的所有課程，並緩存以避免多次載入
let courseCache = null;

/**
 * 獲取該學期所有學制的課程，並進行緩存
 * API 沒有提供學制列表，只取最主要的 'main' (日間部)
 * @param {string} semesterId - 學期 ID (例如: '114-1')
 */
export async function fetchAllSemesterCourses(semesterId) {
    // 檢查緩存：若學期相同，直接返回緩存
    if (courseCache?.semesterId === semesterId) {
        return courseCache.courses;
    }

    const { year, sem } = convertSemesterId(semesterId);
    const SYSTEM = 'main'; // 預設只取日間部

    // API URL: https://gnehs.github.io/ntut-course-crawler-node/114/1/main.json
    const COURSES_URL = `${BASE_URL}${year}/${sem}/${SYSTEM}.json`;

    const response = await fetch(COURSES_URL);
    if (!response.ok) {
        throw new Error(`無法載入 ${year}-${sem} 學期 ${SYSTEM} 的所有課程總表`);
    }
    const apiData = await response.json();

    // 將數據結構緩存
    courseCache = { semesterId, courses: apiData };

    return apiData;
}


// --- 6. 篩選和轉換課表數據 ---

/**
 * 從課程總表中，篩選出某一個班級的課表，並轉換為 TimeTableView 需要的格式
 *
 * @param {Array<object>} allCourses - 該學期所有課程總表
 * @param {string} selectedClassCode - 選定的班級 CODE (例如: '3012')
 * @returns {Array<object>} 該班級的課程列表
 */
export function filterAndConvertSchedule(allCourses, selectedClassKey) {
    // 支援傳入 class id/code（例如: '2788' 或 '3012'）或 dept-id fallback
    if (!selectedClassKey || !allCourses) return [];

    const key = String(selectedClassKey).trim();
    const classNameFromId = key.includes('-') ? key.substring(key.lastIndexOf('-') + 1).trim() : null;

    try {
        // logging disabled in production by default; kept empty to avoid noisy output
    } catch (e) {
        // ignore
    }

    const schedule = [];

    allCourses.forEach(course => {
        // 1. 檢查課程是否適用於選定的班級
        const isTargetClass = course.class?.some(cls => {
            const clsId = String(cls.id ?? '').trim();
            const clsCode = String(cls.code ?? '').trim();
            const clsName = String(cls.name ?? '').trim();

            // 1) 優先比對 class id（department.json 的 class.id）
            if (clsId && key && clsId === key) return true;
            // 2) 再比對 class.code（課表資料可能使用 code 欄位）
            if (clsCode && key && clsCode === key) return true;
            // 3) 若傳入的是 dept-id，嘗試精確比對班級名稱
            if (classNameFromId && clsName && clsName === classNameFromId) return true;
            // 4) 最後嘗試 normalized fuzzy 比對（移除標點與空白後包含或相等）
            try {
                const normalize = s => String(s || '').replace(/[^0-9a-zA-Z\u4e00-\u9fff]/g, '').toLowerCase();
                const nCls = normalize(clsName);
                const nTarget = classNameFromId ? normalize(classNameFromId) : normalize(key);
                if (nCls && nTarget && (nCls === nTarget || nCls.includes(nTarget) || nTarget.includes(nCls))) return true;
            } catch (e) {
                // ignore
            }

            return false;
        });

        if (isTargetClass) {
            // 2. 轉換上課時間格式 (邏輯不變)
            const times = [];
            const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };

            for (const dayStr in course.time) {
                const dayIndex = dayMap[dayStr];
                const periods = course.time[dayStr];

                if (periods.length > 0) {
                    periods.forEach(period => {
                        times.push({ day: dayIndex, period: period });
                    });
                }
            }

            // 3. 獲取教室名稱
            const location = course.classroom?.[0]?.name || '無教室資訊';

            // 4. 處理教師名稱
            let teacherName = '無教師資訊';
            if (Array.isArray(course.teacher) && course.teacher.length > 0) {
                teacherName = course.teacher.map(t => t.name).join('、');
            } else if (course.teacher) {
                teacherName = course.teacher.name || String(course.teacher);
            }

            // 5. 處理圖形對應到的選修 / 必修
            const typeMap = {
                '○': '共同必修',
                '△': '共同必修',
                '☆': '共同選修',
                '●': '專業必修',
                '▲': '專業必修',
                '★': '專業選修'
            };
            const typeSymbol = course.courseType || '';
            const typeName = typeMap[typeSymbol] || typeSymbol;


            schedule.push({
                id: course.id,
                name: course.name?.zh || course.name?.en,
                credits: course.credit || '0',
                hours: course.hours || '0',
                type: typeName,
                teacher: teacherName,
                teachers: course.teacher,
                location: location.split('/')[0].trim(),
                time: times,
                notes: course.notes,
                people: course.people,
                peopleWithdraw: course.peopleWithdraw,
                class: course.class,
                description: course.description?.zh + '\n' + course.description?.en,
                courseDescriptionLink: course.courseDescriptionLink,
                syllabusLinks: course.syllabusLinks
            });
        }
    });

    return schedule;
}