# Firebase 後台設定說明

目前專案尚未連結雲端 Firebase 專案。完成以下設定前，學生可以瀏覽遊戲，但閱讀紀錄不會送出，畫面會提示資料服務尚未設定。

## 1. 建立由教師持有的 Firebase 專案

1. 由教師個人 Google 帳號登入 [Firebase Console](https://console.firebase.google.com/)，建立專案。
2. 新增 Web App，將 SDK 設定的 `apiKey`、`authDomain`、`projectId`、`appId` 填入根目錄 `firebase-config.js`。
3. Firebase Web App 設定會公開出現在網站程式中；不得填入服務帳戶 JSON、私密金鑰或教師密碼。資料保護依賴 Authentication 與 Firestore Security Rules。

## 2. 開啟登入方式與資料庫

1. Firebase Console → Authentication → Sign-in method，啟用「匿名」與「電子郵件／密碼」。
2. 在 Authentication → Users 中，以「新增使用者」建立教師的電子郵件與密碼。網站沒有公開註冊入口。
3. 建立 Cloud Firestore Database。
4. 將本專案 `firestore.rules` 內容發布到 Firestore Rules。未發布安全規則前，不要開始收集學生紀錄。

## 3. 授權教師讀取及管理資料

1. 教師先從網站頁尾打開「教師後台」，登入剛才建立的教師帳號。
2. 在 Firebase Console → Authentication → Users 複製該教師 UID。
3. Firestore 建立 `admins` 集合，新增文件；文件 ID 必須完全等於教師 UID。文件內容可留空，或加上說明欄位。
4. 規則只允許 `admins/{已登入 UID}` 存在的使用者讀取及刪除回報。用戶端無法建立或更改授權清單，請只從 Firebase Console 維護。

## 4. 啟用 App Check

1. Firebase Console → App Check，為網站註冊 reCAPTCHA v3 網頁應用程式，設定正式網站網域。
2. 將 site key 填入 `firebase-config.js` 的 `recaptchaSiteKey`。
3. 先觀察 App Check 指標，確認學校平板及網站請求都已驗證，再對 Cloud Firestore 啟用 Enforcement。若直接強制但 site key／網域尚未設定，學生提交會被拒絕。

## 5. 驗收與發佈

1. 先用教師帳號登入後台，確認空清單可顯示。
2. 用學生端送出測試回報；確認 Firestore 有班級、座號、頁碼、證據、分享內容與時間，且沒有姓名欄位。
3. 確認學生端不能讀取清單，未授權帳號不能查看教師資料。
4. 下載 Excel，開啟檢查欄位；按刪除並再次確認，確認只移除本次下載資料。
5. 測試後刪除測試回報，並從 Firebase Console 備份 Firestore。正式上線前確認 Rules 已發布、App Check Enforcement 已開啟。
6. GitHub Pages 程式須包含 `firebase-config.js` 網頁設定，且 Firebase Authentication 網域允許 Pages 網址。絕不要提交教師密碼或服務帳戶金鑰。

## 資料欄位

`caseId`、`bookTitle`、`chapter`、`className`、`seatNumber`、`pageNumber`、`evidence`、`reflection`、`submittedAt`。學生不需登入個人帳號；匿名 UID 不會顯示在學生表單或教師 Excel 中。
