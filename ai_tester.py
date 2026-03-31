import asyncio
import os
from browser_use import Agent
from langchain_openai import ChatOpenAI

# 🔑 1. PASTE YOUR API KEY HERE (Keep it secret!)
os.environ["OPENAI_API_KEY"] = ""your-api-key-here"
# 🛠️ THE CLEAN HACK: We just slap the missing label directly onto the original class!
ChatOpenAI.provider = "openai"

async def main():
    print("🤖 Booting up the AI QA Engineer...")
    
    # 🧠 Use the standard brain
    llm = ChatOpenAI(model="gpt-4o-mini")
    
    # 🎯 2. THE MISSION
    agent = Agent(
        task="""
        1. Go to https://navodayaco.netlify.app 
        2. Find the 'Sign Up' toggle or button and click it.
        3. Type 'ai_auto_tester@example.com' into the email address input.
        4. Type 'securepassword123' into the password input.
        5. Click the 'Create Account' button.
        6. Wait for the next page to load. Tell me if you see an Onboarding Wizard or a Community Feed.
        """,
        llm=llm, 
    )
    
    # 🚀 3. RUN IT
    result = await agent.run()
    
    print("\n✅ --- TEST FINISHED --- ✅")
    print(result)

if __name__ == "__main__":
    asyncio.run(main())