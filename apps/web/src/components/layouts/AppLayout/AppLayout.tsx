import { PropsWithChildren } from "react";

const AppLayout = ({ children }: PropsWithChildren<unknown>) => {
  return <div className="h-full min-h-0 flex-1 basis-0">{children}</div>;
};

export default AppLayout;
