## Plan: Web Ban Ve Xe Khach 10 Tuan

Muc tieu la xay dung he thong dat ve xe khach full-stack chay on dinh de bao ve mon hoc, dong thoi bo sung mot so tinh nang nang cao vua du de tao diem nhan. Cach tiep can la di tu nen tang den chuc nang: khoi tao kien truc, auth, tim chuyen, chon ghe, dat ve, thanh toan gia lap, quan tri, test, deploy, va tai lieu bao cao.

**Steps**
1. Pha 1 - Chot pham vi va thiet lap du an (Tuan 1)
2. Xac dinh user stories toi thieu: dang ky dang nhap, tim chuyen theo diem di diem den ngay, xem so do ghe, dat ve, huy ve co dieu kien, trang lich su dat ve, trang quan tri chuyen xe co ban.
3. Chot mo hinh du lieu MongoDB: User, Bus, Route, Trip, SeatLayout, Booking, PaymentMock, AuditLog. Lap quy uoc trang thai Booking: pending, paid, cancelled, expired.
4. Sua cau truc backend tu khung Express hien tai thanh module hoa: routes, controllers, services, models, middleware, validators. Tao Global Error Handler va Validation middleware. Phu thuoc: buoc 2.
5. Sua frontend React tu template thanh cau truc pages, components, services api, state store, route guards. 
Phu thuoc: buoc 2.
6. Pha 2 - Xay dung nen tang nghiep vu (Tuan 2-3)
7. Trien khai auth JWT voi bcrypt, refresh token don gian, role user admin. Tao API register login profile va middleware phan quyen.
8. Trien khai module Trip Search: API tim chuyen co phan trang loc theo ngay gia nha xe, frontend danh sach chuyen va chi tiet chuyen.
9. Tao du lieu seed ban dau cho ben xe, nha xe, chuyen xe, so do ghe de demo on dinh. Song song voi buoc 7 va 8.
10. Pha 3 - Dat ve cot loi (Tuan 4-6)
11. Trien khai Seat Selection: lock ghe tam thoi theo thoi gian ngan, ngan dat trung ghe bang unique index va transaction logic.
12. Trien khai Booking flow dau cuoi: tao don, tinh tong tien, xac nhan thanh toan gia lap, cap nhat trang thai, gui thong bao trong he thong.
13. Trien khai trang lich su dat ve va chi tiet ve cho nguoi dung. Song song voi buoc 12 sau khi API san sang.
14. Pha 4 - Quan tri va nang cao vua phai (Tuan 7-8)
15. Trien khai admin dashboard co ban: CRUD chuyen xe, quan ly ghe trong, xem danh sach dat ve, bo loc theo trang thai.
16. Them 1-2 tinh nang nang cao de lay diem: thong ke doanh thu theo ngay, export CSV, hoac goi y chuyen pho bien theo lich su tim kiem.
17. Toi uu UX: thong bao loi ro rang, loading states, responsive mobile desktop, empty states.
18. Pha 5 - Kiem thu, deploy, bao cao (Tuan 9-10)
19. Viet test uu tien cho luong quan trong: auth, dat ghe, tao booking, cap nhat trang thai. Them mot so integration tests API.
20. Kiem thu thu cong theo kich ban demo cuoi ky: luong thanh cong, luong that bai, edge case dat trung ghe, token het han.
21. Deploy backend va frontend len nen tang free tier, cau hinh bien moi truong, tao tai khoan demo user va admin.
22. Hoan thien bao cao ky thuat: kien truc, mo hinh du lieu, API chinh, bao mat, test evidence, hinh anh man hinh, huong phat trien tiep.

**Relevant files**
- d:/Projects/TicketBookingWeb/backend/src/server.js - Giu vai tro diem vao backend va quan ly khoi dong server.
- d:/Projects/TicketBookingWeb/backend/src/app.js - Mo rong middleware, gan route modules, va error handler tong.
- d:/Projects/TicketBookingWeb/backend/package.json - Bo sung thu vien auth, db, validation, test scripts.
- d:/Projects/TicketBookingWeb/frontend/src/main.jsx - Gan Router va global providers.
- d:/Projects/TicketBookingWeb/frontend/src/App.jsx - Tach thanh khung layout va route pages.
- d:/Projects/TicketBookingWeb/frontend/package.json - Bo sung thu vien api client, state management, router, test.
- d:/Projects/TicketBookingWeb/frontend/src/App.css - Chinh style tong va responsive.

**Verification**
1. Chay backend dev va frontend dev, xac nhan ket noi API health va endpoint auth tim chuyen booking.
2. Chay bo test auth va booking, muc tieu dat pass cho luong dat ve thanh cong va chan dat trung ghe.
3. Demo end-to-end voi 2 vai tro user admin tren ban deploy: tim chuyen, chon ghe, thanh toan gia lap, xem lich su, admin cap nhat chuyen.
4. Kiem tra responsive tren mobile desktop va toc do tai trang chinh duoi nguong cho phep cua mon hoc.
5. Doi chieu danh sach tieu chi cham diem mon hoc voi tung tinh nang da hoan thanh trong bao cao.

**Decisions**
- Team size la 1 nguoi, nen uu tien scope vua du va luyen tap day du full-stack thay vi mo rong qua nhieu module.
- Database chon MongoDB de phu hop stack hien co va toc do phat trien.
- Muc tieu la can bang: dap ung yeu cau mon hoc va them it tinh nang nang cao co gia tri trinh bay.
- Chua ro yeu cau deploy bat buoc, nhung van de xuat deploy de tang chat luong demo va bao cao.
- Ngoai pham vi: thanh toan that voi cong thanh toan ben thu 3, realtime websocket phuc tap, va he thong da tenant.

**Further Considerations**
1. Neu giang vien khong bat buoc deploy, van nen deploy toi thieu mot ban staging de tranh loi moi truong luc bao ve.
2. Neu qua tai tien do, uu tien giu vung auth + search + seat + booking + admin co ban truoc khi them tinh nang nang cao.
3. Nen khoa scope sau Tuan 3 de tranh mo rong tinh nang gay tre tien do cho mot nguoi.