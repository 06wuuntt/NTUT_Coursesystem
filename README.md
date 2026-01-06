# NTUT Course System | 北科課程系統

一個為國立臺北科技大學（NTUT）學生設計的現代化課程管理系統。提供直觀的課表查詢、排課模擬與畢業門檻查詢功能，旨在解決傳統選課系統介面不友善與資訊分散的問題。

> **Live Demo:** [點擊這裡預覽網站](https://06wuuntt.github.io/NTUT_Coursesystem/)

## 主要功能 (Features)

本專案採用模組化設計，主要包含以下功能：

### 首頁 (Home)
- 系統入口與儀表板概覽。

### 班級課表 (Class Schedule)
- 提供 **卡片視圖 (Card View)** 與 **課表視圖 (TimeTable View)** 兩種顯示模式。
- 支援課程篩選功能，可快速找到特定課程。

### 排課模擬器 (Class Simulation)
- 互動式的排課介面，允許學生搜尋課程。
- 支援模擬試排，可即時檢視衝堂與學分配置狀況。

### 行事曆 (Calendar)
- 整合學校重要日程與個人課程安排。
- 支援月視圖 (Month View) 檢視。

### 課程標準 (Course Standards)
- 查詢各系所的畢業學分門檻與必選修標準。
- 視覺化呈現學分達成率與標準結果。

### 課程詳情 (Course Detail)
- 查看詳細的課程大綱、授課教授與時間地點資訊。

## 使用工具 (Tool)

- **Frontend Framework:** React.js (Hooks & Functional Components)
- **Styling:** CSS3 (Component-based CSS)
- **Routing:** React Router
- **Build Tool:** Create React App
- **Deployment:** GitHub Pages

## 專案結構 (Project Structure)

本專案採用 Feature-based 的架構，將相關的 UI 與邏輯封裝在各自的功能資料夾中。

```text
src/
├── api/              # API 請求與服務邏輯 (CourseService)
├── components/       # 共用元件
│   ├── forms/        # 表單元件 (SelectInput)
│   ├── layouts/      # 頁面佈局 (MainLayout)
│   └── ui/           # 基礎 UI 元件 (Loader, Toast)
├── constants/        # 全域常數設定 (Periods, Routes)
├── features/         # 核心功能模組
│   ├── Calendar/     # 行事曆功能
│   ├── ClassSchedule/# 班級課表
│   ├── ClassSimulation/# 排課模擬器
│   ├── CourseDetail/ # 課程詳細頁
│   ├── CourseStandards/# 畢業標準查詢
│   └── Home/         # 首頁
├── styles/           # 統一樣式
│   ├──style.css
├── App.js            # 路由設定與主程式入口
└── index.js          # 專案渲染入口
```
## 快速開始 (Getting Started)

若要在本地端運行此專案，請按照以下步驟操作：

### 1. 複製專案
```bash
git clone https://github.com/06wuuntt/NTUT_Coursesystem.git
cd NTUT_Coursesystem
```

### 2. 安裝
```bash
npm install
```

### 3. 啟動開發伺服器
```bash
npm start
```
啟動後，瀏覽器將自動開啟 http://localhost:3000

## 部署 (Deployment)

本專案配置為部署至 GitHub Pages。若要手動部署更新：

```bash
# 1. 建置生產版本
npm run build

# 2. 部署至 gh-pages 分支
npm run deploy
```