import { Protect, useClerk, useUser } from "@clerk/clerk-react";
import { NavLink } from "react-router-dom";
import {
  House,
  Eraser,
  FileText,
  Hash,
  Image,
  Scissors,
  SquarePen,
  Users,
  LogOut,
} from "lucide-react";

const navItems = [
  { to: "/ai", label: "Dashboard", Icon: House },
  { to: "/ai/write-article", label: "AI Article Writer", Icon: SquarePen },
  { to: "/ai/blog-title", label: "Blog Titles", Icon: Hash },
  { to: "/ai/generate-image", label: "Generate Images", Icon: Image },
  { to: "/ai/remove-background", label: "Remove Background", Icon: Eraser },
 
  { to: "/ai/review-resume", label: "Review Resume", Icon: FileText },
];
const Sidebar = ({ sidebar, setsidebar }) => {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  return (
    <>
      <div
        className={`w-60 bg-white  flex flex-col justify-between items-center max-sm:absolute top-14 bottom-0 ${
          sidebar ? "translate-x-0" : "max-sm:-translate-x-full"
        } transition-all duration-300 ease-in-out`}
      >
        <div className="my-6 w-full flex flex-col justify-between items-center ">
          <img
            src={user.imageUrl}
            alt="user avtar"
            className="w-12 rounded-full mx-auto"
          />
          <h1 className="w-full my-2 text-center">{user.fullName}</h1>
          <div className="border-t border-light  mt-5 text-gray font-medium">
            {navItems.map((items) => (
              <NavLink
                key={items.to}
                to={items.to}
                end={items.to === "/ai"}
                onClick={() => setsidebar(false)}
                className={({ isActive }) =>
                  `px-3.5 py-2.5 flex items-center gap-3 rounded ${
                    isActive
                      ? "bg-gradient-to-r from-[#3C81F6] to-[#9234EA] text-white"
                      : " "
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <items.Icon
                      className={`w-4 h-4 ${isActive ? "text-white" : ""}`}
                    />
                    {items.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="w-full border-t border-light p-4 px-7 flex items-center justify-between">
          <div
            className="flex gap-2 items-center cursor-pointer"
            onClick={openUserProfile}
          >
            <img src={user.imageUrl} className="w-8 rounded-full " alt="" />
            <div>
              <h1 className="text-sm font-medium">{user.fullName}</h1>
              <p className="text-xs text-gray ">
                <Protect plan="premium" fallback="free">
                  Premium
                </Protect>
                Plan
              </p>
            </div>
          </div>
          <LogOut
            onClick={signOut}
            className="w-4 text-gray hover:text-gray-600 transition cursor-pointer"
          />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
