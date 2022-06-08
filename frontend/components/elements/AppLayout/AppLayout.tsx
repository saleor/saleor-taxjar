import { IconButton, SettingsIcon } from "@saleor/macaw-ui";
import React from "react";
import { Item } from "../../../../types/common";
import AppHeader from "../AppHeader";
import AppSidebar from "../AppSidebar";
import { useStyles } from "./styles";

interface AppLayoutProps {
  title: string;
  items: Item[];
  selectedItem?: Item;
  loading: boolean;
  onBackClick?: () => void;
  onSettingsClick?: () => void;
  onItemClick: (item: Item) => void;
}

const AppLayout: React.FC<React.PropsWithChildren<AppLayoutProps>> = ({
  title,
  items,
  selectedItem,
  loading,
  onBackClick,
  onSettingsClick,
  onItemClick,
  children,
}) => {
  const classes = useStyles();

  return (
    <>
      <AppHeader
        onBack={onBackClick}
        menu={
          onSettingsClick && (
            <IconButton onClick={onSettingsClick}>
              <SettingsIcon />
            </IconButton>
          )
        }
      >
        {title}
      </AppHeader>
      <div className={classes.root}>
        <AppSidebar
          items={items}
          selectedItem={selectedItem}
          loading={loading}
          onItemClick={onItemClick}
        />
        <div className={classes.content}>{children}</div>
      </div>
    </>
  );
};
export default AppLayout;
