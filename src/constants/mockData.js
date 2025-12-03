// 模擬的入學年分選項
export const MOCK_YEARS = [
  { value: '113', label: '113 學年度' },
  { value: '112', label: '112 學年度' },
  { value: '111', label: '111 學年度' },
];

// 模擬的系所選項
export const MOCK_DEPARTMENTS = [
  { value: 'CS', label: '資訊工程學系' },
  { value: 'EE', label: '電機工程學系' },
  { value: 'BA', label: '企業管理學系' },
];

// 模擬的課程標準結果 (根據年分和系所)
export const MOCK_STANDARDS = {
  '113_CS': {
    requiredCredits: 50,
    electiveCredits: 30,
    graduationTotal: 128,
  },
  '112_EE': {
    requiredCredits: 45,
    electiveCredits: 35,
    graduationTotal: 125,
  },
};

export const MOCK_SEMESTERS = [
  { value: '114-1', label: '114 上學期' },
  { value: '113-2', label: '113 下學期' },
  { value: '113-1', label: '113 上學期' },
  { value: '112-2', label: '112 下學期' },
];

// 模擬學院/系所/班級層級
export const MOCK_ACADEMIES = [
    { value: 'ENG', label: '工程學院', departments: [
        { value: 'CS', label: '資訊工程學系', classes: [
            { value: 'CS114A', label: '資工 114 甲班' },
            { value: 'CS114B', label: '資工 114 乙班' },
        ]},
        { value: 'EE', label: '電機工程學系', classes: [
            { value: 'EE114A', label: '電機 114 甲班' },
        ]},
    ]},
    { value: 'MGMT', label: '管理學院', departments: [
        { value: 'BA', label: '企業管理學系', classes: [
            { value: 'BA114A', label: '企管 114 甲班' },
        ]},
    ]},
];

// 模擬課程資料結構 (此為資工 114 甲班，114-1 學期的課表)
export const MOCK_SCHEDULE_DATA = {
    'CS114A_114-1': [
        { id: 101, name: '計算機概論', credits: 3, teacher: '王小明', location: '電學大樓 301', 
          time: [{ day: 1, period: '3-4' }] }, // 星期一 3, 4 節
        { id: 102, name: '線性代數', credits: 3, teacher: '陳美麗', location: '綜合大樓 205', 
          time: [{ day: 2, period: '1-2' }] }, // 星期二 1, 2 節
        { id: 103, name: '程式設計(一)', credits: 3, teacher: '李大衛', location: '電學大樓 102', 
          time: [{ day: 4, period: '3-5' }, { day: 5, period: '6' }] }, // 星期四 3-5 節, 星期五 6 節
        { id: 104, name: '體育-籃球', credits: 1, teacher: '林大力', location: '體育館', 
          time: [{ day: 3, period: '7-8' }] }, // 星期三 7, 8 節
    ],
};

// 模擬上課節次時間
export const MOCK_PERIODS = [
    { id: 1, time: '08:10-09:00' },
    { id: 2, time: '09:10-10:00' },
    { id: 3, time: '10:10-11:00' },
    { id: 4, time: '11:10-12:00' },
    { id: 5, time: '12:10-13:00' }, // 中午
    { id: 6, time: '13:10-14:00' },
    { id: 7, time: '14:10-15:00' },
    { id: 8, time: '15:10-16:00' },
    { id: 9, time: '16:10-17:00' },
    { id: 10, time: '17:10-18:00' },
];

// 新增：模擬所有可選課程列表
export const MOCK_ALL_COURSES = [
    { id: 201, name: '微積分(一)', credits: 3, teacher: '黃大同', location: '共同 101', time: [] },
    { id: 202, name: '資料結構', credits: 3, teacher: '張三', location: '電學 305', 
      time: [{ day: 1, period: '3-4' }, { day: 3, period: '1' }] },
    { id: 203, name: '離散數學', credits: 3, teacher: '李四', location: '共同 202', 
      time: [{ day: 2, period: '6-7' }] },
    { id: 204, name: '憲法與人權', credits: 2, teacher: '吳王', location: '人文大樓', 
      time: [{ day: 4, period: '8-9' }] },
    { id: 205, name: '體育-羽球', credits: 1, teacher: '陳武', location: '體育館', 
      time: [{ day: 5, period: '1-2' }] },
    { id: 206, name: '網路程式設計', credits: 3, teacher: '劉六', location: '資工實驗室', 
      time: [{ day: 1, period: '6-8' }] },
];

// 初始化空的課表
export const INITIAL_SCHEDULE = {
    selectedCourses: [], // 儲存已選課程的 id
    courseData: {},      // 儲存已選課程的完整資訊 (方便查找)
    grid: {},            // 儲存網格佔用情況，例如：{'1_3': 202, '3_1': 202}
};