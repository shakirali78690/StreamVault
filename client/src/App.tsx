import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Home from "@/pages/home";
import ShowDetail from "@/pages/show-detail";
import Watch from "@/pages/watch";
import Search from "@/pages/search";
import Category from "@/pages/category";
import Watchlist from "@/pages/watchlist";
import Admin from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import Privacy from "@/pages/privacy";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <>
      <Header />
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/show/:slug" component={ShowDetail} />
          <Route path="/watch/:slug" component={Watch} />
          <Route path="/search" component={Search} />
          <Route path="/category/:slug" component={Category} />
          <Route path="/watchlist" component={Watchlist} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin" component={Admin} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/series" component={Home} />
          <Route path="/movies" component={Home} />
          <Route path="/trending" component={Home} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
