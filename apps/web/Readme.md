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

on correct OTP we are going on this page only http://localhost:3000/loyalty/flowers-vechu-chu whihc is cool , and if we chnage session info in cookie then it pushing in this page http://localhost:3000/loyalty/login?business=flowers-vechu-chu which is cool so no need ot wory about that shit , but we can make sure that non session user either gets redirected to login page of the bussiness of we show them the info of this , i think pushing them on login is better
