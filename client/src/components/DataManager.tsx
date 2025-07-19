import React, { useState } from 'react';
import axios from 'axios';

const DataManager: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<string>('');
  const [importFile, setImportFile] = useState<File | null>(null);

  // JSONエクスポート
  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const response = await axios.get('/api/export/json', {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      link.download = `racedb_export_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('JSONエクスポート完了');
    } catch (error) {
      console.error('JSONエクスポートエラー:', error);
      alert('JSONエクスポートに失敗しました');
    }
    setExporting(false);
  };

  // CSVエクスポート
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await axios.get('/api/export/csv', {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      link.download = `racedb_export_${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('CSVエクスポート完了');
    } catch (error) {
      console.error('CSVエクスポートエラー:', error);
      alert('CSVエクスポートに失敗しました');
    }
    setExporting(false);
  };

  // ファイル選択処理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult('');
    }
  };

  // JSONインポート
  const handleImportJSON = async () => {
    if (!importFile) {
      alert('ファイルを選択してください');
      return;
    }

    setImporting(true);
    setImportResult('');

    try {
      const fileContent = await importFile.text();
      const importData = JSON.parse(fileContent);
      
      const response = await axios.post('/api/import/json', importData);
      
      setImportResult(
        `インポート完了: ${response.data.imported}件追加, ${response.data.skipped}件スキップ (総件数: ${response.data.total}件)`
      );
      
      // ファイル選択をリセット
      setImportFile(null);
      const input = document.getElementById('import-file') as HTMLInputElement;
      if (input) input.value = '';
      
    } catch (error: any) {
      console.error('インポートエラー:', error);
      if (error.response?.data?.error) {
        setImportResult(`エラー: ${error.response.data.error}`);
      } else {
        setImportResult('インポートに失敗しました');
      }
    }
    setImporting(false);
  };

  return (
    <div style={{ margin: '20px 0' }}>
      <h2>データ管理</h2>
      
      {/* エクスポート機能 */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>データエクスポート</h3>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          現在のレースデータを外部ファイルとして保存します。バックアップや他システムとの連携に使用できます。
        </p>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportJSON}
            disabled={exporting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.6 : 1
            }}
          >
            {exporting ? 'エクスポート中...' : 'JSON形式でエクスポート'}
          </button>
          
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.6 : 1
            }}
          >
            {exporting ? 'エクスポート中...' : 'CSV形式でエクスポート'}
          </button>
        </div>
        
        <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          <ul style={{ marginLeft: '20px' }}>
            <li><strong>JSON形式:</strong> 完全なデータ構造を保持。再インポートに最適</li>
            <li><strong>CSV形式:</strong> Excel等での分析に適した表形式。1行1頭の構成</li>
          </ul>
        </div>
      </div>

      {/* インポート機能 */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
        <h3 style={{ marginTop: 0 }}>データインポート</h3>
        <p style={{ color: '#856404', marginBottom: '15px' }}>
          <strong>注意:</strong> 外部ファイルからレースデータを一括登録します。既存データとIDが重複する場合はスキップされます。
        </p>
        
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="import-file" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            インポートファイル（JSON形式のみ対応）:
          </label>
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '3px', width: '300px' }}
          />
        </div>
        
        {importFile && (
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px' }}>
            <strong>選択ファイル:</strong> {importFile.name} ({Math.round(importFile.size / 1024)}KB)
          </div>
        )}
        
        <button
          onClick={handleImportJSON}
          disabled={importing || !importFile}
          style={{
            padding: '10px 20px',
            backgroundColor: !importFile ? '#6c757d' : '#ffc107',
            color: !importFile ? 'white' : '#212529',
            border: 'none',
            borderRadius: '5px',
            cursor: importing || !importFile ? 'not-allowed' : 'pointer',
            opacity: importing ? 0.6 : 1
          }}
        >
          {importing ? 'インポート中...' : 'データをインポート'}
        </button>
        
        {importResult && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: importResult.includes('エラー') ? '#f8d7da' : '#d4edda',
            borderRadius: '5px',
            color: importResult.includes('エラー') ? '#721c24' : '#155724'
          }}>
            {importResult}
          </div>
        )}
        
        <div style={{ marginTop: '15px', fontSize: '14px', color: '#856404' }}>
          <strong>インポート可能な形式:</strong> 
          <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
            <li>このアプリでエクスポートしたJSON形式のファイル</li>
            <li>同じデータ構造を持つ外部JSONファイル</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataManager;