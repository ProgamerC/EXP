// apps/frontend/app/page.jsx
import { redirect } from "next/navigation";

export default function Home() {
  // сразу отправляем пользователя на новый каталог с фильтрами
  redirect("/cars");
}
