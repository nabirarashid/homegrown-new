# homegrown 🌱

*swipe local, support community*

## what is homegrown?

homegrown is a mobile app that makes discovering local businesses as addictive as scrolling through tiktok or swiping on tinder. users swipe through local shops, restaurants, and services in an endless feed, helping small businesses get the visibility they deserve while making local exploration fun and effortless.

currently supporting 30+ local businesses with rich profiles, photos, and deals that users can like, save, and share.

## why i built this

living in a world dominated by big box stores and chain restaurants, i watched amazing local businesses struggle to compete with the marketing budgets of massive corporations. these small shops had incredible stories, unique products, and personal service, but people just didn't know they existed.

i realized that discovery was the problem - not quality. local businesses needed a way to reach people that felt natural and engaging, not like traditional advertising. so i built homegrown to give local shops the same addictive, swipeable interface that makes people spend hours on social media, but focused entirely on their community.

plus, i wanted to prove that shopping local doesn't have to feel like a chore - it can be as fun as your favorite app.

## how i built it

**frontend magic:**
- **react** - component-based architecture made it easy to build reusable business cards and swipe components
- **typescript** - kept me sane while managing all the business data structures and user interactions  
- **tailwind css** - rapid prototyping and consistent styling across all the swipeable cards

**backend power:**
- **firebase auth** - handled user accounts and authentication seamlessly
- **firestore database** - real-time data for business profiles, user likes, and saved favorites

the trickiest part was nailing the swipe mechanics - making them feel as smooth as tinder while handling all the edge cases (what happens when you run out of businesses? how do you prevent duplicate swipes?). spent way too many nights tweaking gesture recognition and card animations.

## what i struggled with (and learned!)

**the swipe struggle:** getting the swipe gestures to feel natural took forever. i went through like 5 different gesture libraries before finally building my own custom solution. learned that sometimes the "simple" features are actually the hardest to get right.

**data modeling headaches:** figuring out how to structure business data in firestore while keeping queries fast was brutal. learned the hard way that nosql databases require a completely different mindset than traditional sql.

**real user feedback:** showing this to actual local business owners was terrifying but eye-opening. they had completely different priorities than i expected (turns out they care more about analytics than fancy animations). learned to build for users, not for my own ego.

**mobile-first reality check:** originally built this desktop-first like an idiot. had to basically rebuild the entire interface when i realized everyone would be using this on their phones. now i always start mobile and work up.

## getting started

```bash
# clone the repo
git clone https://github.com/yourusername/homegrown.git

# install dependencies  
cd homegrown
npm install

# start the development server
npm run dev
```

## the impact so far

30+ local businesses are already seeing increased foot traffic and customer engagement. turns out when you make discovery fun, people actually want to explore their community. who knew? 

## try it out

live app: https://homegrownapp.shop

---

*made with ❤️ for small businesses everywhere*
