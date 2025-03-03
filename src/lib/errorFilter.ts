/**
 * Adds a global error filter to suppress noisy ENS errors in the console
 */
export function setupErrorFilters() {
  if (typeof window !== 'undefined') {
    // Store the original console.error
    const originalConsoleError = console.error;
    
    // Known problematic function signatures that we want to filter
    const knownProblematicSignatures = [
      '0xd44d3394', // HEIGHT function
      '0x69ea80d5'  // WIDTH function
    ];
    
    // Replace with a filtered version
    console.error = function filterError(...args: any[]) {
      // Convert args to string for easier filtering
      const errorString = args.join(' ');
      
      // Check if this contains a known problematic function signature
      const containsProblematicSignature = knownProblematicSignatures.some(
        sig => errorString.includes(sig)
      );
      
      // Check if this is an ENS-related error we want to suppress
      const isEnsError = 
        errorString.includes('ENS') || 
        errorString.includes('getEnsName') || 
        errorString.includes('getEnsAvatar') ||
        errorString.includes('ContractFunctionExecutionError') ||
        errorString.includes('missing response for request') ||
        errorString.includes('missing revert data') ||
        containsProblematicSignature;
      
      // If it's an ENS error, downgrade to a warning or suppress completely
      if (isEnsError) {
        // Optionally log as warning instead of completely suppressing
        // console.warn('Suppressed ENS error:', ...args);
        return;
      }
      
      // Pass through other errors to the original console.error
      originalConsoleError.apply(console, args);
    };
    
    // Also filter some contract errors in console.warn
    const originalConsoleWarn = console.warn;
    console.warn = function filterWarning(...args: any[]) {
      const warningString = args.join(' ');
      
      // Check if this is a contract-related warning we want to suppress
      const isContractWarning = 
        warningString.includes('Contract') ||
        warningString.includes('batch size') ||
        warningString.includes('Mocking response');
      
      if (isContractWarning) {
        // Suppress completely
        return;
      }
      
      // Pass through other warnings
      originalConsoleWarn.apply(console, args);
    };
  }
} 