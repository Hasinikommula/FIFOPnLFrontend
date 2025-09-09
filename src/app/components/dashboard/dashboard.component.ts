import { ChangeDetectorRef, Component, ElementRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { TransactionDto, TxnType } from '../../models/transaction';
import { DashboardSummary, FifoPlService } from '../../services/fifo-pl.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  today: string = new Date().toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
  submitted: boolean = false;

  transactions: TransactionDto[] = [];
  dashboardSummary: DashboardSummary = {
    totalPnl: 0,
    totalTransactions: 0,
    totalProducts: 0,
    profitableProducts: 0,
    pnlByProduct: {}
  };

  newTransaction: TransactionDto = {
    date: new Date().toISOString(),
    product: '',
    txnType: TxnType.Buy,
    quantity: 0,
    pricePerUnit: 0,
    id: 0
  };

  showForm: boolean = false;
  showProductPnl: boolean = false; // toggle state
@ViewChild('pnlChart') private chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chartInstance: Chart | undefined;

  constructor(
    private fifoPlService: FifoPlService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    console.log('ngOnInit: Loading dashboard data');
    this.loadDashboardData();
  }
 

  onSubmit(form: any) {
  this.submitted = true; // shows errors if form invalid
  if (form.valid) {
    this.addTransaction();
    this.submitted = false; // resets after success
    form.resetForm();
  }
}
  ngAfterViewInit(): void {
    console.log('ngAfterViewInit: Canvas available:', !!this.chartCanvas?.nativeElement);
    if (isPlatformBrowser(this.platformId) && this.chartCanvas?.nativeElement && this.hasProductData()) {
      console.log('ngAfterViewInit: Initializing chart');
      this.initializeChart();
    } else {
      console.log('ngAfterViewInit: Canvas, data, or browser not ready, will retry after data load');
    }
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      console.log('ngOnDestroy: Destroying chart instance');
      this.chartInstance.destroy();
    }
  }

  loadDashboardData(): void {
    this.fifoPlService.getDashboardSummary().subscribe({
      next: (data) => {
        console.log('loadDashboardData: Received data', data);
        this.dashboardSummary = data;
        this.cdr.detectChanges();
        if (isPlatformBrowser(this.platformId) && this.chartCanvas?.nativeElement && this.hasProductData()) {
          if (this.chartInstance) {
            console.log('loadDashboardData: Updating existing chart');
            this.updateChartData();
          } else {
            console.log('loadDashboardData: Initializing chart');
            this.initializeChart();
          }
        } else {
          console.log('loadDashboardData: Canvas, data, or browser not available');
          console.log('Is browser:', isPlatformBrowser(this.platformId));
          console.log('Canvas element:', this.chartCanvas?.nativeElement);
          console.log('Has product data:', this.hasProductData());
        }
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
      }
    });
  }

  addTransaction(): void {
    this.fifoPlService.addTransaction(this.newTransaction).subscribe({
      next: () => {
        this.loadDashboardData();
        this.resetForm();
      },
      error: (error) => {
        console.error('Error adding transaction:', error);
      }
    });
  }

  resetForm(): void {
    this.newTransaction = {
      id: 0,
      date: new Date().toISOString(),
      product: '',
      txnType: TxnType.Buy,
      quantity: 0,
      pricePerUnit: 0
    };
    this.showForm = false;
  }

  getProductPnlClass(pnl: number): string {
    return pnl >= 0 ? 'profit' : 'loss';
  }

  getTotalPnlClass(): string {
    return this.dashboardSummary.totalPnl >= 0 ? 'profit' : 'loss';
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  hasProductData(): boolean {
    return this.getObjectKeys(this.dashboardSummary.pnlByProduct).length > 0;
  }


private initializeChart(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('initializeChart: Skipping, not in browser');
      return;
    }
    if (!this.chartCanvas?.nativeElement) {
      console.error('initializeChart: Canvas element not found');
      return;
    }

    if (this.chartInstance) {
      console.log('initializeChart: Destroying previous chart instance');
      this.chartInstance.destroy();
    }

    console.log('initializeChart: Creating new chart');
    try {
      this.chartInstance = new Chart(this.chartCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Profit/Loss',
            data: [],
            backgroundColor: (context) => {
              const value = context.dataset.data[context.dataIndex] as number;
              return value >= 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)';
            },
            borderColor: (context) => {
              const value = context.dataset.data[context.dataIndex] as number;
              return value >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)';
            },
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: { display: true, text: 'Products' }
            },
            y: {
              title: { display: true, text: 'Profit/Loss ($)' }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`
              }
            }
          }
        }
      });
      this.updateChartData();
    } catch (error) {
      console.error('initializeChart: Error creating chart', error);
    }
  }

  private updateChartData(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('updateChartData: Skipping, not in browser');
      return;
    }
    if (!this.chartInstance) {
      console.error('updateChartData: Chart instance not initialized');
      return;
    }

    const products = this.getObjectKeys(this.dashboardSummary.pnlByProduct);
    const pnlValues = products.map(product => this.dashboardSummary.pnlByProduct[product]);

    console.log('updateChartData: Products:', products, 'P&L Values:', pnlValues);

    this.chartInstance.data.labels = products;
    this.chartInstance.data.datasets[0].data = pnlValues;
    this.chartInstance.update();
  }
  toggleTransactionForm() {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.showProductPnl = false; // Hide P&L if form is opened
    }
  }

  toggleProductPnl() {
    this.showProductPnl = !this.showProductPnl;
    if (this.showProductPnl) {
      this.showForm = false; // Hide form if P&L is opened
    }
  }
}
