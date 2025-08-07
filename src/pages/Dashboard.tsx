
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Deal } from "@/types/deal";
import { CalendarDays, Users, TrendingUp, DollarSign, BarChart3, RefreshCw, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { YearlyRevenueSummary } from "@/components/YearlyRevenueSummary";

interface DashboardStats {
  totalDeals: number;
  totalRevenue: number;
  wonDeals: number;
  activeDeals: number;
  leadConversionRate: number;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalDeals: 0,
    totalRevenue: 0,
    wonDeals: 0,
    activeDeals: 0,
    leadConversionRate: 0,
  });
  
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch all deals for statistics
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*');

      if (dealsError) throw dealsError;

      const allDeals = (deals || []) as unknown as Deal[];
      
      // Calculate statistics
      const totalDeals = allDeals.length;
      const wonDeals = allDeals.filter(deal => deal.stage === 'Won').length;
      const activeDeals = allDeals.filter(deal => 
        !['Won', 'Lost', 'Dropped'].includes(deal.stage)
      ).length;
      
      const totalRevenue = allDeals
        .filter(deal => deal.stage === 'Won')
        .reduce((sum, deal) => sum + (deal.total_contract_value || 0), 0);
      
      const leadConversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

      setStats({
        totalDeals,
        totalRevenue,
        wonDeals,
        activeDeals,
        leadConversionRate,
      });

      // Get recent deals (last 5)
      const recentDeals = allDeals
        .sort((a, b) => new Date(b.modified_at || b.created_at).getTime() - new Date(a.modified_at || a.created_at).getTime())
        .slice(0, 5);
      
      setRecentDeals(recentDeals);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStageColor = (stage: string) => {
    const stageColors = {
      'Lead': 'bg-gray-100 text-gray-800',
      'Discussions': 'bg-blue-100 text-blue-800',
      'Qualified': 'bg-green-100 text-green-800',
      'RFQ': 'bg-yellow-100 text-yellow-800',
      'Offered': 'bg-purple-100 text-purple-800',
      'Won': 'bg-emerald-100 text-emerald-800',
      'Lost': 'bg-red-100 text-red-800',
      'Dropped': 'bg-gray-100 text-gray-800',
    };
    return stageColors[stage as keyof typeof stageColors] || 'bg-gray-100 text-gray-800';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your pipeline overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={fetchDashboardData} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => navigate('/deals')} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeDeals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.wonDeals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leadConversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Recent Deals
            </CardTitle>
            <CardDescription>Your latest deal activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDeals.length > 0 ? (
              recentDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate('/deals')}>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{deal.project_name || deal.deal_name}</p>
                    <p className="text-xs text-muted-foreground">{deal.customer_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStageColor(deal.stage)} variant="secondary">
                      {deal.stage}
                    </Badge>
                    {deal.total_contract_value && (
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(deal.total_contract_value)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent deals found</p>
            )}
            {recentDeals.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full mt-4" 
                onClick={() => navigate('/deals')}
              >
                View All Deals
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Yearly Revenue Summary */}
        <YearlyRevenueSummary />
      </div>
    </div>
  );
};

export default Dashboard;
