import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";

import { ModalProvider, Modal } from "../context/Modal";
import { thunkAuthenticate } from "../redux/session";
import { PageHeader } from "../components/common/PageHeader";

export default function Layout() {
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    dispatch(thunkAuthenticate()).then(() => setIsLoaded(true));
  }, [dispatch]);

  return (
    <ModalProvider>
      <div className="w-full h-max flex flex-col flex-nowrap">
        <header className="w-full h-[45px] fixed top-0 flex flex-col flex-nowrap items-center bg-white">
          {isLoaded && <PageHeader />}
        </header>
        <div className="w-full h-max mt-[45px] flex justify-center">
          {/* margin-top equal to header height
          (45px without category search bar) */}
          {isLoaded && <Outlet />}
        </div>
      </div>
      <Modal />
    </ModalProvider>
  );
}
