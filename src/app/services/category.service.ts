import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../../types';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private http: HttpClient) { }

  createCategory(url: string, formData: FormData): Observable<any> {
    return this.http.post(url, formData, { withCredentials: true });
  }

  updateCategory(url: string, formData: FormData): Observable<any> {
    return this.http.put(url, formData, { withCredentials: true });
  }
  
  getCategories(url: string): Observable<Category[]> { 
    return this.http.get<any>(url).pipe( 
      map(response => response.data)
    );
  }
  
  getCategory(url: string): Observable<Category> { 
    return this.http.get<any>(url).pipe( 
      map(response => response.data)
    );
  }
  
  deleteCategory(url: string): Observable<any> {
    return this.http.delete(url);
  }
  private baseUrl = `${environment.apiUrl}/api/category`;
  getPdf(categoryId: string, language: string): Observable<Blob> {
    const url = `${this.baseUrl}/pdf/${categoryId}/${language}`;
    return this.http.get(url, { responseType: 'blob' });
  }
}
