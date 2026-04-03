// Debug component to check environment variables
export function DebugEnv() {
  console.log('Environment variables:', {
    VITE_GOOGLE_SHEETS_API_KEY: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
    VITE_SPREADSHEET_ID: import.meta.env.VITE_SPREADSHEET_ID,
    allEnv: import.meta.env
  });
  
  return (
    <div style={{padding: '20px', background: '#f0f0f0', margin: '20px'}}>
      <h3>Debug Environment Variables</h3>
      <p><strong>VITE_GOOGLE_SHEETS_API_KEY:</strong> {import.meta.env.VITE_GOOGLE_SHEETS_API_KEY ? '✅ Set' : '❌ Not set'}</p>
      <p><strong>VITE_SPREADSHEET_ID:</strong> {import.meta.env.VITE_SPREADSHEET_ID ? '✅ Set' : '❌ Not set'}</p>
      <details>
        <summary>All Environment Variables</summary>
        <pre>{JSON.stringify(import.meta.env, null, 2)}</pre>
      </details>
    </div>
  );
}
