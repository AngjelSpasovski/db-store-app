// src/app/user/new-research/dummy-id.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DummyIdService {
  // List of valid national IDs (id_match)
  private validIds = [
    'NCLTZN96P09C719R',
    'ZMRTZN12A23D112P',
    'BTAVLT54R08H666V',
  ];

  private testSearchKeys        = ['id','id_match','firstname','lastname','zipcode','city','region_code','phone1'];
  private testSearchValidData_1 = ['1','NCLTZN96P09C719R','Eva','Bragaglia','71040','Arese','VB','0522706230'];
  private testSearchValidData_2 = ['2','ZMRTZN12A23D112P','Dario','Desio','57128','Cingia De Botti','OT','0974478970'];
  private testSearchValidData_3 = ['3','BTAVLT54R08H666V','Giorgia','Tuzzolino','41021','Sant Imento','BA','0994691295'];

  /**
   * Returns true if the given ID exists in our dummy list.
   */
  exists(id: string): boolean {
    return this.validIds.includes(id.trim().toUpperCase());
  }
}
