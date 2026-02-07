insta auto dm

online menu

IMP :

In referal ,expiration , theme and all is not done , points are getting tp both the people , but for points we have to make sure it gets expire after "X" days , so maybe cROn and also a way where we set expiryDate in DB hihv helps to chekc how many points are still remaining

T and C system is also not done yet

Baki:
referal
Loyalty
QR
Feedback
Tier
Membership

analytics
email
sms
whatsapp
gamification
billing
SKU adding

<!--  form https://www.openloyalty.io/  -->

Points
Tiers
Games of chance
Rewards
Wallets
Spin the wheel
Referrals
Achievements
Lotteries
Badges
Leaderboard
Scratch & win

https://www.youtube.com/watch?v=691KWbNnZHM&t=383s

priorituy access , extended window support , personal guidance and services , free dibs on new produscts

https://www.unifynd.com/
https://thriwe.com/
https://squareup.com/us/en
https://www.openloyalty.io/

We are a company which works with many B2C and D2C retail stores and brands , we want to handle entire loyalty platform and whataspp marketing for them .
So we willl send multiple 1000's of whataspp messages every month from a business WP account . Also we dont want to seprate accounts for each userl number , if possible. single account in gupshup should handle multiple WP
numbers and send msgs seprately from each number using APIS

5. Public / dynamic route params not validated (length/format) (DoS / bad input)
   Where:
   apps/web/src/app/api/referral/program/[businessSlug]/route.ts
   apps/web/src/app/api/public/business/[slug]/register-info/route.ts
   Similar dynamic segments elsewhere
   Issue: businessSlug and slug are taken from the URL and used in Prisma (e.g. where: { slug: businessSlug }) without validating length or format. Very long or malformed values could stress the DB or cause unexpected behavior.
   Fix: Validate dynamic params with Zod (or your existing schema):
   Use slugSchema (or equivalent) from lib/schemas/common.ts to enforce length and allowed characters.
   Apply the same pattern to other public or dynamic segments so all route params are validated before use.
   Summary

check this and you will nderstand a need of a variable
and one more thing , right now in bill creation there is one issue ,
what is happening is if a bill oof 1000 is created with 10% cashback point , so they will reciece 100 point , now let say user comes next time and make another bill of 1000 then he redeem the 100 points from pre back , so the bill amount should be 1000 but points should only be given on 900 , if admin wants to give to 1000 then its fine usin a var ( make new )

cashback means give amount in the same bill , deduct the amount in the same bill and no loyalty points will be there for thatbill , but loyalty points mesns give loyalty point , free item means give free item , and % points means give in per

no suggesyion shoyuld come in inpiuts

issue in image.pmg

we have a x amount of token given to person who regiter themselves , but people can do one thing like regietre and then immeditely make a bill which can make loss , so we should have a "x" amount of days to wait for using yhis point

~~add animation in form~~ (done: step slide + fade in `LinearMultiStepForm`, `animateSteps` prop to toggle)
