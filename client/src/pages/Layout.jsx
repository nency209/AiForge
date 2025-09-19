import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { Menu, X } from "lucide-react";
import { useUser, SignIn } from "@clerk/clerk-react";

const Layout = () => {
  const navigate = useNavigate();
  const [sidebar, setsidebar] = useState(false);
  const { user } = useUser();
  return user ? (
    <div className="flex flex-col items-start h-full w-full  justify-start">
      <nav className="w-full px-8 flex items-center justify-start  ">
        <img
          src={assets.logo}
          alt=""
          onClick={() => navigate("/")}
          className="w-8 h-8 "
        />
        {sidebar ? (
          <X
            onClick={() => setsidebar(false)}
            className="w-6 h-6 text-primary sm:hidden block"
          />
        ) : (
          <Menu
            onClick={() => setsidebar(true)}
            className="w-6 h-6 text-primary sm:hidden"
          />
        )}
      </nav>

      <div className="flex w-full border-t border-light h-screen">
        <Sidebar sidebar={sidebar} setsidebar={setsidebar} />

        <div className="flex-1 bg-[#F4F7FB]">
          <Outlet />
        </div>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-screen">
      <SignIn />
    </div>
  );
};

export default Layout;
