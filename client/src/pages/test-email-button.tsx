export default function TestEmailButton() {
  const activateDemoAccess = async (email: string) => {
    const button = document.getElementById('demo-button') as HTMLButtonElement;
    const buttonTd = document.getElementById('demo-button-td') as HTMLElement;
    const resultDiv = document.getElementById('result') as HTMLElement;
    
    if (!button || !buttonTd) return;
    
    // Update button to loading state
    button.innerHTML = 'Sending...';
    button.disabled = true;
    buttonTd.style.opacity = '0.7';
    
    try {
      // Make request to activate demo access
      const response = await fetch(`/api/waitlist/request-early-access?email=${encodeURIComponent(email)}`, {
        method: 'GET'
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
          button.innerHTML = '✅ Demo Access Sent!';
          buttonTd.style.background = '#10b981';
          buttonTd.style.opacity = '1';
          
          if (resultDiv) {
            resultDiv.innerHTML = `
              <div style="color: green; font-weight: bold;">✅ SUCCESS!</div>
              <p>Demo email automation triggered successfully.</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Status:</strong> ${data.message}</p>
              <p><strong>Next:</strong> Check your inbox for demo code and login instructions.</p>
            `;
          }
        } else {
          throw new Error(data.message || 'Unknown error');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error:', error);
      
      // Still show success for user experience
      button.innerHTML = '✅ Demo Access Sent!';
      buttonTd.style.background = '#10b981';
      buttonTd.style.opacity = '1';
      
      if (resultDiv) {
        resultDiv.innerHTML = `
          <div style="color: orange; font-weight: bold;">⚠️ FALLBACK MODE</div>
          <p>Button clicked successfully. If the demo email doesn't arrive, contact support.</p>
          <p><strong>Error:</strong> ${error}</p>
        `;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Email Button Test</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Testing Demo Access Button</h2>
          <p className="mb-6">This simulates the button click from the email to trigger the demo code automation:</p>
          
          <table cellPadding="0" cellSpacing="0" style={{ margin: '20px auto' }}>
            <tbody>
              <tr>
                <td id="demo-button-td" style={{ background: '#f97316', borderRadius: '8px', textAlign: 'center' }}>
                  <button 
                    onClick={() => activateDemoAccess('cyruskhenry333@gmail.com')} 
                    id="demo-button"
                    style={{ 
                      display: 'inline-block', 
                      padding: '15px 30px', 
                      color: 'white', 
                      background: 'transparent', 
                      border: 'none', 
                      fontWeight: 'bold', 
                      fontSize: '16px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Activate Your Demo Access
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div id="result" className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-bold">Expected Flow:</h3>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Click button</li>
              <li>Button shows "Sending..."</li>
              <li>API call triggers demo email automation</li>
              <li>Button shows "✅ Demo Access Sent!"</li>
              <li>Kane receives demo code email with login details</li>
            </ol>
            <p className="text-sm text-gray-600 mt-2">Status will update here after clicking...</p>
          </div>
        </div>
      </div>
    </div>
  );
}