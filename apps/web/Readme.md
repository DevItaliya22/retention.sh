insta auto dm

online menu

Cashier email is unique per business only (Cashier.email + @@unique(businessId, email)); User.email is null for cashiers; two businesses can have cashiers with the same email.

colour sky

enter doesnot work in multi step form , password fields are shittyand need eye button , dont worry you can chnage it later in cahsier password

IMP :

older sessions should be removed frm the broswer , means if the token is invalid in cookies then it should be deleetd so it can send the user to login page

means having no cookie or having fals cookie should act same

In referal ,expiration , theme and all is not done , points are getting tp both the people , but for points we have to make sure it gets expire after "X" days , so maybe cROn and also a way where we set expiryDate in DB hihv helps to chekc how many points are still remaining

T and C system is also not done yet

Baki:
Loyalty
QR
Feedback
Tier
Membership

right now in loyalty , there is swapping in giving the points (IMP)

password shoyld have eye button , cashier email should always end with @companyslug

Also we have to add a field for "website" in business

customer login page shouold ve http://localhost:3000/loyalty/login?phone=%2B919988776655&business=flowers-vechu-chu not like this , it should be like http://localhost:3000/loyalty/login/flowers-vechu-chu?phone=xyz here we have to use businesslug in route not in random place as this is very mpo

also in that page when we are gicing wrong OTP it is pushing to /login which is admin login page , we should show only that fucker thi is wrong , and if correct then push to http://localhost:3000/loyalty/flowers-vechu-chu with session , if there is no sesion and someone goes on this page then we will show them ifo about the company

CAn make a redirect logic hook for each 3 role , this can help i future too maybe , not sure , also have to make al the compoent refactor

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
