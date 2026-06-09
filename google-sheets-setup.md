# Google 試算表 + Google Apps Script 設定步驟

這個專案是無框架的純前端單字學習/管理 App，已新增「儲存單字時同步送到後端」的功能。後端會使用 Google Apps Script 接收資料，並將單字資料寫入 Google 試算表。

## 1. 建立 Google 試算表

1. 開啟 Google 試算表 (Google Sheets)。
2. 建立一個新的試算表，並在第一列填入欄位標題：
   - `Timestamp`
   - `英文單字`
   - `中文翻譯`
   - `詞性`
   - `例句`
   - `字根分析`
3. 這個試算表會儲存每一次從前端送出的單字資料。

## 2. 建立 Google Apps Script

1. 在 Google 試算表中，點選「擴充功能（Extensions）」>「Apps Script」。
2. 在 Apps Script 編輯器中，建立一個新的專案。
3. 刪除預設內容，貼上以下程式碼：

```javascript
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    const row = [
      new Date(),
      payload.word || '',
      payload.translation || '',
      payload.pos || '',
      payload.example || '',
      payload.root || ''
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: '已成功寫入試算表' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: 'Google Apps Script Web App 已啟用。' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. 部署為 Web App

1. 在 Apps Script 編輯器右上方點選「部署」>「新增部署」。
2. 選擇「Web App」。
3. 設定：
   - `部署說明`：例如 `word-save-endpoint`
   - `執行身分`：選擇「我自己（Execute as me）」。
   - `可存取對象`：選擇「任何人，包括匿名使用者（Anyone）」或「任何人」（取決於你的需求）。
4. 部署後，會取得一個 Web App URL，形如：
   `https://script.google.com/macros/s/XXXXXXXXXX/exec`
5. 複製這個 URL，稍後填入前端程式碼。

## 4. 更新前端程式碼

1. 打開專案中的 `app.js`。
2. 找到 `BACKEND_ENDPOINT` 常數：

```javascript
const BACKEND_ENDPOINT = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

3. 將 `YOUR_SCRIPT_ID` 替換成剛才部署後取得的 Web App URL。

## 5. 前端提交資料流程

當管理者在表單中填寫資料並點擊「儲存單字」時，前端會執行以下流程：

1. 驗證 `英文單字` 是否已填寫。
2. 將單字資料加入本機 localStorage。
3. 呼叫 Google Apps Script 的後端 URL，使用 `POST` 並送出 JSON：
   - `word`
   - `translation`
   - `pos`
   - `example`
   - `root`
4. 後端會將資料寫入 Google 試算表中。

## 6. 測試方法

1. 打開 `index.html`，切換到「單字管理」頁籤。
2. 輸入 `英文單字`、`中文翻譯`、`詞性`、`例句`、`字根分析`。
3. 按下「儲存單字」。
4. 如果 `BACKEND_ENDPOINT` 正確設定，應該會看到狀態訊息「已儲存並同步：...」。
5. 打開 Google 試算表，確認新資料已新增在最後一列。

## 7. 常見問題與排查

- 如果看到 `請先將 BACKEND_ENDPOINT 更新為已部署的 Google Apps Script 網址。`，代表你尚未替換 `app.js` 中的佔位網址。
- 如果看到 `後端同步失敗`，請檢查：
  - Web App 是否已部署。
  - `BACKEND_ENDPOINT` 是否正確貼上。
  - Apps Script 是否已設為允許任何人存取。
  - Apps Script 是否有正確處理 `doPost`。
- 若發生 CORS 或權限問題，請確認 Web App 的存取權限已設定為「任何人，包括匿名使用者」。

## 8. 建議

- 若你希望更安全，之後可以改成要求使用者登入再進行 Apps Script 存取。
- 若你想儲存更多欄位，可以在 `google-sheets-setup.md` 中新增對應欄位，並同步更新 Apps Script 與 `app.js`。
