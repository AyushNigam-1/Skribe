import { defineConfig, devices } from '@playwright/test';


 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */





 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './__tests__',
  
  fullyParallel: true,
  
  forbidOnly: !!process.env.CI,
  
  retries: process.env.CI ? 2 : 0,
  
  workers: process.env.CI ? 1 : undefined,
  
  reporter: 'html',
  
  use: {
    
    baseURL: 'http://localhost:5173',
    
    trace: 'on-first-retry',
  },

  
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      
    },

    
    
    
    

    
    
    
    

    
    
    
    
    
    
    
    
    

    
    
    
    
    
    
    
    
    
  ],

  
  
  
  
  
  
});
