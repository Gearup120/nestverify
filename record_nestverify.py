import asyncio
from playwright.async_api import async_playwright

async def record_walkthrough():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=True)
        
        # Create a context with video recording enabled
        context = await browser.new_context(
            record_video_dir="recordings/",
            viewport={'width': 1280, 'height': 800}
        )
        
        page = await context.new_page()
        
        print("🚀 Navigating to NestVerify...")
        await page.goto("http://localhost:5174/", wait_until="networkidle")
        
        # Wait for animations to settle
        await asyncio.sleep(2)
        
        print("🎬 Starting cinematic scroll...")
        
        # Smooth scroll script
        await page.evaluate("""
            async () => {
                const distance = 100;
                const delay = 100;
                while (document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight) {
                    window.scrollBy(0, distance);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        """)
        
        await asyncio.sleep(2)
        print("✅ Recording finished!")
        
        await context.close()
        await browser.close()
        
        print("\n🎉 Your video has been saved to the 'recordings/' folder in your project directory.")

if __name__ == "__main__":
    asyncio.run(record_walkthrough())
